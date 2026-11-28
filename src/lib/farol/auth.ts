/* eslint-disable @typescript-eslint/no-explicit-any */
import { sanitizeWorkspaceInstallments } from './installments';

export const AUTH_SESSION_STORAGE_KEY = 'farol_auth_session_v1';

export interface CloudSessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface AuthControllerDeps {
  getState: () => Record<string, any>;
  setState: (next: Record<string, any>) => void;
  getUsersIndex: () => { activeUserId: string; users: Array<{ id: string; name: string }> };
  saveUsersIndex: (index: { activeUserId: string; users: Array<{ id: string; name: string }> }) => void;
  getUserStorageKey: (userId: string) => string;
  getCleanEmptyState: (userName?: string) => Record<string, any>;
  isUntouchedDemoState: (st: Record<string, any>) => boolean;
  mergeDefaultCategories: (st: Record<string, any>) => Record<string, any>;
  hasCustomizedUserData: (st: Record<string, any>) => boolean;
  readStoredStateRaw: (userId: string) => Record<string, any> | null;
  getImportableLocalDefaultState: () => Record<string, any> | null;
  ensureValidStateShape: (candidate: any, fallbackName?: string) => Record<string, any>;
  upgradeLegacyThemeOnce: (st: Record<string, any>) => void;
  loadStateForUser: (userId: string, fallbackName?: string | null) => Record<string, any>;
  renderApp: () => void;
  showUndoToast: (msg: string) => void;
  trackFarolEvent: (eventType: string, target: string, label: string) => void;
  openFarolModal: (modalOrId: any) => void;
  closeFarolModal: (modalOrId: any, immediate?: boolean) => void;
  closeFarolProductTour: (markDone?: boolean) => void;
  maybeAutoStartProductTour: () => void;
}

export function setPasswordFieldVisibility(inputId: string, visible: boolean): void {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) return;
  input.type = visible ? 'text' : 'password';
  document.querySelectorAll<HTMLElement>(`[data-toggle-password="${inputId}"]`).forEach((btn) => {
    btn.classList.toggle('is-visible', visible);
    btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
    const label = visible ? 'Ocultar senha' : 'Mostrar senha';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  });
}

export function resetAllPasswordVisibilities(): void {
  ['gate-password', 'auth-password', 'reset-new-password', 'reset-confirm-password'].forEach((id) => {
    setPasswordFieldVisibility(id, false);
  });
}

export function bindPasswordVisibilityToggles(): void {
  document.querySelectorAll<HTMLElement>('[data-toggle-password]').forEach((btn) => {
    if (btn.dataset.toggleBound === '1') return;
    btn.dataset.toggleBound = '1';
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.togglePassword;
      const input = targetId ? (document.getElementById(targetId) as HTMLInputElement | null) : null;
      if (!input || !targetId) return;
      const nextVisible = input.type === 'password';
      setPasswordFieldVisibility(targetId, nextVisible);
    });
  });
}

export function isLocalTourPreviewMode(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = window.location.hostname || '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal && new URLSearchParams(window.location.search || '').get('tour') === '1';
}

export function createAuthController(deps: AuthControllerDeps) {
  let cloudSessionUser: CloudSessionUser | null = null;
  let otpCooldownInterval: ReturnType<typeof setInterval> | null = null;
  let pendingOtpRemember = true;

  function getCloudSessionUser(): CloudSessionUser | null {
    return cloudSessionUser;
  }

  function setCloudSessionUser(user: CloudSessionUser | null): void {
    cloudSessionUser = user;
  }

  function setAuthGateVisibility(showGate: boolean): void {
    const gate = document.getElementById('auth-gate-screen');
    const shell = document.getElementById('main-app-shell');
    if (gate) gate.style.display = showGate ? 'flex' : 'none';
    if (shell) shell.style.display = showGate ? 'none' : 'grid';
    if (showGate) {
      document.documentElement.setAttribute('data-theme', 'light');
      deps.closeFarolProductTour(false);
    } else {
      deps.maybeAutoStartProductTour();
    }
  }

  function startOtpCooldownTimer(seconds = 60, btnId = 'btn-gate-resend-otp'): void {
    const resendBtn = document.getElementById(btnId) as HTMLButtonElement | null;
    if (!resendBtn) return;
    if (otpCooldownInterval) {
      clearInterval(otpCooldownInterval);
      otpCooldownInterval = null;
    }

    let rem = Math.max(0, Math.round(seconds));
    const updateLabel = () => {
      if (rem > 0) {
        resendBtn.disabled = true;
        resendBtn.textContent = `Reenviar código (${rem}s)`;
      } else {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Reenviar código agora';
        if (otpCooldownInterval) {
          clearInterval(otpCooldownInterval);
          otpCooldownInterval = null;
        }
      }
    };
    updateLabel();
    if (rem > 0) {
      otpCooldownInterval = setInterval(() => {
        rem -= 1;
        updateLabel();
      }, 1000);
    }
  }

  function getOtpBoxes(): HTMLInputElement[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>('.otp-digit-box:not(.reset-otp-digit-box)'));
  }

  function getResetOtpBoxes(): HTMLInputElement[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>('.reset-otp-digit-box'));
  }

  function clearAndFocusOtpBoxes(): void {
    const boxes = getOtpBoxes();
    boxes.forEach((b) => {
      b.value = '';
    });
    if (boxes[0]) setTimeout(() => boxes[0].focus(), 40);
  }

  function clearAndFocusResetOtpBoxes(): void {
    const boxes = getResetOtpBoxes();
    boxes.forEach((b) => {
      b.value = '';
    });
    if (boxes[0]) setTimeout(() => boxes[0].focus(), 40);
  }

  function fillOtpBoxesWithCode(codeStr: string): void {
    const digits = String(codeStr || '').replace(/\D/g, '').slice(0, 6);
    const boxes = getOtpBoxes();
    boxes.forEach((b, idx) => {
      b.value = digits[idx] || '';
    });
    const lastIdx = Math.min(5, Math.max(0, digits.length - 1));
    if (boxes[lastIdx]) boxes[lastIdx].focus();
  }

  function fillResetOtpBoxesWithCode(codeStr: string): void {
    const digits = String(codeStr || '').replace(/\D/g, '').slice(0, 6);
    const boxes = getResetOtpBoxes();
    boxes.forEach((b, idx) => {
      b.value = digits[idx] || '';
    });
    const lastIdx = Math.min(5, Math.max(0, digits.length - 1));
    if (boxes[lastIdx]) boxes[lastIdx].focus();
  }

  function getEnteredOtpCode(): string {
    return getOtpBoxes().map((b) => (b.value || '').trim()).join('');
  }

  function getEnteredResetOtpCode(): string {
    return getResetOtpBoxes().map((b) => (b.value || '').trim()).join('');
  }

  function showOtpVerificationStep({
    email,
    purpose,
    cooldownSeconds = 60,
  }: {
    email?: string;
    purpose?: string;
    cooldownSeconds?: number;
  }): void {
    const formGate = document.getElementById('form-auth-gate');
    const formOtp = document.getElementById('form-auth-otp');
    const formForgot = document.getElementById('form-auth-forgot');
    const formReset = document.getElementById('form-auth-reset');
    const titleEl = document.getElementById('auth-gate-title');
    const badgeEl = document.getElementById('otp-badge-label');
    const emailDisplay = document.getElementById('otp-email-display');
    const targetEmailInput = document.getElementById('otp-target-email') as HTMLInputElement | null;
    const purposeInput = document.getElementById('otp-purpose') as HTMLInputElement | null;
    const otpFeedback = document.getElementById('otp-feedback');

    if (formGate) formGate.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
    if (formReset) formReset.style.display = 'none';
    if (formOtp) formOtp.style.display = 'flex';
    if (titleEl) titleEl.textContent = 'Verifique seu código';
    if (targetEmailInput) targetEmailInput.value = email || '';
    if (purposeInput) purposeInput.value = purpose || 'login';
    if (emailDisplay) emailDisplay.textContent = email || '';
    if (badgeEl) {
      badgeEl.textContent =
        purpose === 'register' ? 'Ativação de Conta (OTP)' : 'Autenticação em 2 Etapas (2FA)';
    }
    if (otpFeedback) otpFeedback.style.display = 'none';

    resetAllPasswordVisibilities();
    clearAndFocusOtpBoxes();
    startOtpCooldownTimer(cooldownSeconds || 60, 'btn-gate-resend-otp');
  }

  function showForgotPasswordStep(prefillEmail = ''): void {
    const formGate = document.getElementById('form-auth-gate');
    const formOtp = document.getElementById('form-auth-otp');
    const formForgot = document.getElementById('form-auth-forgot');
    const formReset = document.getElementById('form-auth-reset');
    const titleEl = document.getElementById('auth-gate-title');
    const forgotEmail = document.getElementById('forgot-email') as HTMLInputElement | null;
    const forgotFeedback = document.getElementById('forgot-feedback');

    if (otpCooldownInterval) {
      clearInterval(otpCooldownInterval);
      otpCooldownInterval = null;
    }

    if (formGate) formGate.style.display = 'none';
    if (formOtp) formOtp.style.display = 'none';
    if (formReset) formReset.style.display = 'none';
    if (formForgot) formForgot.style.display = 'flex';
    if (titleEl) titleEl.textContent = 'Recuperar senha';
    if (forgotFeedback) forgotFeedback.style.display = 'none';
    document.querySelectorAll('[data-gate-mode-btn]').forEach((btn) => btn.classList.remove('active'));

    const gateEmail = document.getElementById('gate-email') as HTMLInputElement | null;
    const emailToUse = String(prefillEmail || gateEmail?.value || '').trim();
    if (forgotEmail) {
      if (emailToUse) forgotEmail.value = emailToUse;
      setTimeout(() => forgotEmail.focus(), 40);
    }
    resetAllPasswordVisibilities();
  }

  function showResetPasswordStep({
    email,
    cooldownSeconds = 60,
  }: {
    email?: string;
    cooldownSeconds?: number;
  }): void {
    const formGate = document.getElementById('form-auth-gate');
    const formOtp = document.getElementById('form-auth-otp');
    const formForgot = document.getElementById('form-auth-forgot');
    const formReset = document.getElementById('form-auth-reset');
    const titleEl = document.getElementById('auth-gate-title');
    const targetEmailInput = document.getElementById('reset-target-email') as HTMLInputElement | null;
    const emailDisplay = document.getElementById('reset-email-display');
    const newPwInput = document.getElementById('reset-new-password') as HTMLInputElement | null;
    const confirmPwInput = document.getElementById('reset-confirm-password') as HTMLInputElement | null;
    const resetFeedback = document.getElementById('reset-feedback');

    if (formGate) formGate.style.display = 'none';
    if (formOtp) formOtp.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
    if (formReset) formReset.style.display = 'flex';
    if (titleEl) titleEl.textContent = 'Criar nova senha';
    if (targetEmailInput) targetEmailInput.value = email || '';
    if (emailDisplay) emailDisplay.textContent = email || '';
    if (newPwInput) newPwInput.value = '';
    if (confirmPwInput) confirmPwInput.value = '';
    if (resetFeedback) resetFeedback.style.display = 'none';
    document.querySelectorAll('[data-gate-mode-btn]').forEach((btn) => btn.classList.remove('active'));

    resetAllPasswordVisibilities();
    clearAndFocusResetOtpBoxes();
    startOtpCooldownTimer(cooldownSeconds || 60, 'btn-gate-resend-reset');
  }

  function setAuthGateMode(mode: string): void {
    const isReg = mode === 'register';
    const formGate = document.getElementById('form-auth-gate');
    const formOtp = document.getElementById('form-auth-otp');
    const formForgot = document.getElementById('form-auth-forgot');
    const formReset = document.getElementById('form-auth-reset');
    const modeInput = document.getElementById('gate-mode') as HTMLInputElement | null;
    const titleEl = document.getElementById('auth-gate-title');
    const nameWrap = document.getElementById('gate-name-wrap');
    const submitLabel = document.getElementById('gate-submit-label');
    const heroTitle = document.getElementById('gate-hero-title');
    const heroSub = document.getElementById('gate-hero-sub');
    const heroBtn = document.getElementById('gate-hero-toggle-btn');
    const forgotBtn = document.getElementById('gate-forgot-btn');
    const switchPrompt = document.getElementById('gate-switch-prompt');
    const inlineSwitch = document.getElementById('gate-switch-inline');
    const feedback = document.getElementById('gate-feedback');

    if (otpCooldownInterval) {
      clearInterval(otpCooldownInterval);
      otpCooldownInterval = null;
    }

    if (formGate) formGate.style.display = 'flex';
    if (formOtp) formOtp.style.display = 'none';
    if (formForgot) formForgot.style.display = 'none';
    if (formReset) formReset.style.display = 'none';
    if (modeInput) modeInput.value = isReg ? 'register' : 'login';
    if (titleEl) titleEl.textContent = isReg ? 'Crie sua conta' : 'Acesse sua conta';
    if (nameWrap) nameWrap.style.display = isReg ? 'flex' : 'none';
    if (forgotBtn) forgotBtn.style.display = isReg ? 'none' : 'inline-block';
    const pwInput = document.getElementById('gate-password');
    if (pwInput) {
      pwInput.setAttribute('autocomplete', isReg ? 'new-password' : 'current-password');
      pwInput.setAttribute('placeholder', isReg ? 'Crie uma senha (mín. 8 caracteres)' : 'Digite sua senha');
    }
    resetAllPasswordVisibilities();
    if (submitLabel) submitLabel.textContent = isReg ? 'CRIAR CONTA' : 'ENTRAR';
    if (heroTitle) heroTitle.textContent = isReg ? 'JÁ TEM CONTA?' : 'BEM-VINDO!';
    if (heroSub) {
      heroSub.textContent = isReg
        ? 'Entre com seu e-mail e senha para acessar seu painel financeiro sincronizado na nuvem'
        : 'Insira seus dados e comece sua jornada financeira conosco no Farol';
    }
    if (heroBtn) heroBtn.textContent = isReg ? 'FAZER LOGIN' : 'CRIAR CONTA';
    if (switchPrompt) switchPrompt.textContent = isReg ? 'Já tem uma conta?' : 'Ainda não tem conta?';
    if (inlineSwitch) inlineSwitch.textContent = isReg ? 'Fazer login' : 'Criar conta grátis';
    if (feedback) feedback.style.display = 'none';
    document.querySelectorAll<HTMLElement>('[data-gate-mode-btn]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.gateModeBtn === (isReg ? 'register' : 'login'));
    });
  }

  function resolveAuthenticatedWorkspaceState(
    user: CloudSessionUser,
    candidateServerState: Record<string, any> | null,
    authPurpose: string | null = null
  ) {
    const cleanBase = deps.getCleanEmptyState(user.name);

    if (authPurpose === 'register') {
      cleanBase.userEmail = user.email;
      if (cleanBase.profile) cleanBase.profile.name = user.name;
      cleanBase.isExplicitDemo = false;
      return { nextState: cleanBase, shouldSync: true, migratedFromDefault: false };
    }

    const serverIsDemo = Boolean(candidateServerState && deps.isUntouchedDemoState(candidateServerState));
    const validServer =
      candidateServerState && typeof candidateServerState === 'object' && !serverIsDemo
        ? deps.mergeDefaultCategories({ ...cleanBase, ...candidateServerState })
        : null;
    const serverCustomized = Boolean(validServer && deps.hasCustomizedUserData(validServer));

    const localUserRaw = deps.readStoredStateRaw(user.id);
    const localIsDemo = Boolean(localUserRaw && deps.isUntouchedDemoState(localUserRaw));
    const validLocalUser =
      localUserRaw && !localIsDemo ? deps.mergeDefaultCategories({ ...cleanBase, ...localUserRaw }) : null;
    const localUserCustomized = Boolean(validLocalUser && deps.hasCustomizedUserData(validLocalUser));

    const importableDefault = deps.getImportableLocalDefaultState();
    const alreadyInitializedCloudUser = Boolean(
      (validServer && Number(validServer.updatedAt) > 0) ||
        (validLocalUser && Number(validLocalUser.updatedAt) > 0)
    );

    let nextState = cleanBase;
    let shouldSync = false;
    let migratedFromDefault = false;

    if (serverCustomized && localUserCustomized && validServer && validLocalUser) {
      const serverUpdated = Number(validServer.updatedAt) || 0;
      const localUpdated = Number(validLocalUser.updatedAt) || 0;
      if (localUpdated > serverUpdated) {
        nextState = validLocalUser;
        shouldSync = true;
      } else {
        nextState = validServer;
      }
    } else if (serverCustomized && validServer) {
      nextState = validServer;
    } else if (localUserCustomized && validLocalUser) {
      nextState = validLocalUser;
      shouldSync = true;
    } else if (importableDefault && !alreadyInitializedCloudUser && authPurpose !== 'register') {
      nextState = deps.mergeDefaultCategories({ ...cleanBase, ...importableDefault, isExplicitDemo: false });
      shouldSync = true;
      migratedFromDefault = true;
    } else if (validServer && validLocalUser) {
      const serverUpdated = Number(validServer.updatedAt) || 0;
      const localUpdated = Number(validLocalUser.updatedAt) || 0;
      if (localUpdated > serverUpdated) {
        nextState = validLocalUser;
        shouldSync = true;
      } else {
        nextState = validServer;
      }
    } else if (validServer) {
      nextState = validServer;
    } else if (validLocalUser) {
      nextState = validLocalUser;
      if (!candidateServerState || serverIsDemo) shouldSync = true;
    } else {
      nextState = cleanBase;
      if (!candidateServerState || serverIsDemo || localIsDemo) {
        shouldSync = true;
      }
    }

    nextState = deps.ensureValidStateShape(nextState, user.name);
    nextState.userEmail = user.email;
    if (nextState.profile) nextState.profile.name = user.name;
    nextState.isExplicitDemo = false;
    deps.upgradeLegacyThemeOnce(nextState);
    const sanitizedResolved = sanitizeWorkspaceInstallments(nextState);
    if (sanitizedResolved.changed) {
      nextState = sanitizedResolved.state;
      shouldSync = true;
    }

    return { nextState, shouldSync, migratedFromDefault };
  }

  function ensureUserInIndex(user: CloudSessionUser | null): void {
    if (!user || !user.id) return;
    const usersIndex = deps.getUsersIndex();
    if (!Array.isArray(usersIndex.users)) usersIndex.users = [];
    usersIndex.activeUserId = user.id;
    const existing = usersIndex.users.find((u) => u.id === user.id);
    if (existing) {
      if (user.name) existing.name = user.name;
    } else {
      usersIndex.users.push({ id: user.id, name: user.name || 'Minha Conta' });
    }
    deps.saveUsersIndex(usersIndex);
  }

  function updateAuthHeaderBadge(): void {
    const dot = document.getElementById('auth-status-dot');
    const label = document.getElementById('auth-btn-label');
    const adminLink = document.getElementById('admin-panel-link');
    const isAdminUser = Boolean(cloudSessionUser && cloudSessionUser.isAdmin === true);
    if (adminLink) {
      adminLink.style.display = isAdminUser ? 'inline-flex' : 'none';
    }
    if (!dot || !label) return;
    if (cloudSessionUser && cloudSessionUser.email) {
      dot.style.background = 'var(--green-emerald)';
      label.textContent = cloudSessionUser.name || cloudSessionUser.email.split('@')[0];
    } else {
      dot.style.background = 'var(--amber-gold)';
      label.textContent = 'Entrar / Criar Conta';
    }
  }

  async function syncStateToCloud(): Promise<void> {
    const usersIndex = deps.getUsersIndex();
    if (!cloudSessionUser || !cloudSessionUser.id || usersIndex.activeUserId !== cloudSessionUser.id) {
      return;
    }
    try {
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: deps.getState() }),
      });
    } catch {
      // Fallback silencioso para localStorage
    }
  }

  function applyAuthenticatedUser(
    user: CloudSessionUser,
    serverState: Record<string, any> | null,
    remember = true,
    authPurpose: string | null = null
  ): void {
    cloudSessionUser = user;
    if (typeof window !== 'undefined') {
      if (remember) {
        window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      }
    }
    ensureUserInIndex(user);

    const { nextState, shouldSync, migratedFromDefault } = resolveAuthenticatedWorkspaceState(
      user,
      serverState,
      authPurpose
    );
    deps.setState(nextState);

    if (typeof window !== 'undefined') {
      try {
        if (!nextState.updatedAt) nextState.updatedAt = Date.now();
        window.localStorage.setItem(
          deps.getUserStorageKey(deps.getUsersIndex().activeUserId),
          JSON.stringify(nextState)
        );
      } catch {}
    }

    if (shouldSync) {
      syncStateToCloud();
    }

    updateAuthHeaderBadge();
    setAuthGateVisibility(false);
    deps.renderApp();

    if (migratedFromDefault) {
      deps.showUndoToast('Seus dados locais anteriores foram importados para sua conta na nuvem!');
    }
    deps.trackFarolEvent('auth_success', authPurpose || 'login', 'Conta verificada');
  }

  function openAuthModal(): void {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;
    const loggedView = document.getElementById('auth-logged-view');
    const formFields = document.getElementById('auth-form-fields');
    const logoutBtn = document.getElementById('btn-auth-logout');
    const submitBtn = document.getElementById('btn-auth-submit');
    const feedback = document.getElementById('auth-feedback');
    const loggedEmail = document.getElementById('auth-logged-email');

    if (feedback) feedback.style.display = 'none';

    if (cloudSessionUser && cloudSessionUser.email) {
      if (loggedView) loggedView.style.display = 'block';
      if (formFields) formFields.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.textContent = 'Sincronizar Agora';
      if (loggedEmail) loggedEmail.textContent = `${cloudSessionUser.name} (${cloudSessionUser.email})`;
    } else {
      if (loggedView) loggedView.style.display = 'none';
      if (formFields) formFields.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      const mode = (document.getElementById('auth-mode') as HTMLInputElement | null)?.value || 'login';
      if (submitBtn) submitBtn.textContent = mode === 'register' ? 'Criar minha conta' : 'Entrar na conta';
      const modalForgot = document.getElementById('btn-modal-auth-forgot');
      if (modalForgot) modalForgot.style.display = mode === 'register' ? 'none' : 'inline-block';
    }

    const railBadge = document.getElementById('auth-rail-badge');
    if (railBadge) {
      railBadge.textContent =
        cloudSessionUser && cloudSessionUser.email ? 'Conectado ao PostgreSQL' : 'PostgreSQL + 2FA';
    }

    resetAllPasswordVisibilities();
    deps.openFarolModal(modal);
  }

  function bindOtpInputNavigation(boxes: HTMLInputElement[], fillFn: (code: string) => void): void {
    boxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const val = (target.value || '').replace(/\D/g, '');
        target.value = val.slice(-1);
        if (target.value && idx < boxes.length - 1) {
          boxes[idx + 1].focus();
          boxes[idx + 1].select();
        }
      });

      box.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].focus();
          boxes[idx - 1].value = '';
        }
      });

      box.addEventListener('paste', (e: ClipboardEvent) => {
        e.preventDefault();
        const pasted = (e.clipboardData || (window as any).clipboardData)?.getData('text') || '';
        fillFn(pasted);
      });
    });
  }

  function bindAuthEvents(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = JSON.parse(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || 'null');
        if (savedUser && savedUser.id && savedUser.email) {
          cloudSessionUser = savedUser;
          ensureUserInIndex(savedUser);
          deps.setState(deps.loadStateForUser(savedUser.id, savedUser.name));
          setAuthGateVisibility(false);
          updateAuthHeaderBadge();
        } else if (isLocalTourPreviewMode()) {
          setAuthGateVisibility(false);
        } else {
          setAuthGateVisibility(true);
        }
      } catch {
        setAuthGateVisibility(!isLocalTourPreviewMode());
      }
    }

    bindPasswordVisibilityToggles();

    const heroToggleBtn = document.getElementById('gate-hero-toggle-btn');
    if (heroToggleBtn) {
      heroToggleBtn.addEventListener('click', () => {
        const cur = (document.getElementById('gate-mode') as HTMLInputElement | null)?.value || 'login';
        setAuthGateMode(cur === 'login' ? 'register' : 'login');
      });
    }

    const inlineSwitchBtn = document.getElementById('gate-switch-inline');
    if (inlineSwitchBtn) {
      inlineSwitchBtn.addEventListener('click', () => {
        const cur = (document.getElementById('gate-mode') as HTMLInputElement | null)?.value || 'login';
        setAuthGateMode(cur === 'login' ? 'register' : 'login');
      });
    }

    const forgotBtn = document.getElementById('gate-forgot-btn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        const gateEmail = (document.getElementById('gate-email') as HTMLInputElement | null)?.value || '';
        showForgotPasswordStep(gateEmail);
      });
    }

    const modalForgotBtn = document.getElementById('btn-modal-auth-forgot');
    if (modalForgotBtn) {
      modalForgotBtn.addEventListener('click', () => {
        const modalEmail = (document.getElementById('auth-email') as HTMLInputElement | null)?.value || '';
        deps.closeFarolModal('modal-auth', true);
        setAuthGateVisibility(true);
        showForgotPasswordStep(modalEmail);
      });
    }

    document.querySelectorAll<HTMLElement>('[data-gate-mode-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setAuthGateMode(btn.dataset.gateModeBtn || 'login');
      });
    });

    const formGate = document.getElementById('form-auth-gate');
    if (formGate) {
      formGate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('gate-feedback');
        const showGateMsg = (msg: string, isError = false) => {
          if (!feedback) return;
          feedback.style.display = 'block';
          feedback.style.background = isError ? 'var(--coral-soft)' : 'var(--green-soft)';
          feedback.style.color = isError ? 'var(--coral-red)' : 'var(--green-emerald)';
          feedback.textContent = msg;
        };

        const st = deps.getState();
        const action = (document.getElementById('gate-mode') as HTMLInputElement | null)?.value || 'login';
        const name =
          (document.getElementById('gate-name') as HTMLInputElement | null)?.value?.trim() ||
          st?.profile?.name ||
          'Minha Conta';
        const email = (document.getElementById('gate-email') as HTMLInputElement | null)?.value?.trim() || '';
        const password = (document.getElementById('gate-password') as HTMLInputElement | null)?.value || '';
        pendingOtpRemember = Boolean((document.getElementById('gate-remember') as HTMLInputElement | null)?.checked);

        showGateMsg(
          action === 'register'
            ? 'Gerando código de verificação de cadastro...'
            : 'Validando credenciais e gerando código 2FA...',
          false
        );

        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, name, email, password, state: st }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            showGateMsg(data.error || 'Não foi possível autenticar.', true);
            return;
          }
          if (data.step === 'verify_otp') {
            showOtpVerificationStep(data);
            return;
          }
          if (data.user) {
            applyAuthenticatedUser(data.user, data.state, pendingOtpRemember, data.purpose || null);
            deps.showUndoToast(`Bem-vindo(a), ${data.user.name}! Conta sincronizada na nuvem.`);
          }
        } catch {
          showGateMsg('Erro de conexão com o servidor.', true);
        }
      });
    }

    bindOtpInputNavigation(getOtpBoxes(), fillOtpBoxesWithCode);

    const backOtpBtn = document.getElementById('btn-gate-otp-back');
    if (backOtpBtn) {
      backOtpBtn.addEventListener('click', () => {
        const curMode = (document.getElementById('gate-mode') as HTMLInputElement | null)?.value || 'login';
        setAuthGateMode(curMode);
      });
    }

    const resendOtpBtn = document.getElementById('btn-gate-resend-otp');
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', async () => {
        const email = (document.getElementById('otp-target-email') as HTMLInputElement | null)?.value || '';
        const otpFeedback = document.getElementById('otp-feedback');
        const showOtpMsg = (msg: string, isErr = false) => {
          if (!otpFeedback) return;
          otpFeedback.style.display = 'block';
          otpFeedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
          otpFeedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
          otpFeedback.textContent = msg;
        };
        if (!email) return;
        showOtpMsg('Enviando novo código de 6 dígitos...', false);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resend_otp', email }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            if (data.remainingCooldown) startOtpCooldownTimer(data.remainingCooldown);
            showOtpMsg(data.error || 'Aguarde antes de reenviar.', true);
            return;
          }
          showOtpVerificationStep(data);
          showOtpMsg('Novo código de 6 dígitos enviado! O anterior foi invalidado.', false);
        } catch {
          showOtpMsg('Erro ao reenviar código.', true);
        }
      });
    }

    const formOtp = document.getElementById('form-auth-otp');
    if (formOtp) {
      formOtp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('otp-target-email') as HTMLInputElement | null)?.value || '';
        const code = getEnteredOtpCode();
        const otpFeedback = document.getElementById('otp-feedback');
        const showOtpMsg = (msg: string, isErr = false) => {
          if (!otpFeedback) return;
          otpFeedback.style.display = 'block';
          otpFeedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
          otpFeedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
          otpFeedback.textContent = msg;
        };

        if (code.length !== 6) {
          showOtpMsg('Preencha todos os 6 dígitos do código.', true);
          return;
        }

        showOtpMsg('Verificando código de segurança...', false);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify_otp', email, code, state: deps.getState() }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            showOtpMsg(data.error || 'Código inválido.', true);
            if (data.locked || data.expired) {
              clearAndFocusOtpBoxes();
            }
            return;
          }

          if (otpCooldownInterval) {
            clearInterval(otpCooldownInterval);
            otpCooldownInterval = null;
          }
          applyAuthenticatedUser(data.user, data.state, pendingOtpRemember, data.purpose || null);
          deps.showUndoToast(`Código verificado! Bem-vindo(a), ${data.user.name}.`);
        } catch {
          showOtpMsg('Erro de rede ao validar o código.', true);
        }
      });
    }

    // Fluxo: Esqueci minha senha
    bindOtpInputNavigation(getResetOtpBoxes(), fillResetOtpBoxesWithCode);

    const backForgotBtn = document.getElementById('btn-gate-forgot-back');
    if (backForgotBtn) {
      backForgotBtn.addEventListener('click', () => setAuthGateMode('login'));
    }

    const backResetBtn = document.getElementById('btn-gate-reset-back');
    if (backResetBtn) {
      backResetBtn.addEventListener('click', () => {
        const curEmail = (document.getElementById('reset-target-email') as HTMLInputElement | null)?.value || '';
        showForgotPasswordStep(curEmail);
      });
    }

    const formForgot = document.getElementById('form-auth-forgot');
    if (formForgot) {
      formForgot.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('forgot-email') as HTMLInputElement | null)?.value?.trim() || '';
        const feedback = document.getElementById('forgot-feedback');
        const showForgotMsg = (msg: string, isErr = false) => {
          if (!feedback) return;
          feedback.style.display = 'block';
          feedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
          feedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
          feedback.textContent = msg;
        };

        if (!email) {
          showForgotMsg('Informe o e-mail da sua conta.', true);
          return;
        }

        showForgotMsg('Enviando código de recuperação para seu e-mail...', false);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'forgot_password', email }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            showForgotMsg(data.error || 'Não foi possível enviar o código de recuperação.', true);
            return;
          }
          showResetPasswordStep({ email: data.email || email, cooldownSeconds: data.cooldownSeconds || 60 });
          const resetFeedback = document.getElementById('reset-feedback');
          if (resetFeedback) {
            resetFeedback.style.display = 'block';
            resetFeedback.style.background = 'var(--green-soft)';
            resetFeedback.style.color = 'var(--green-emerald)';
            resetFeedback.textContent =
              'Se houver uma conta com este e-mail, enviamos um código de 6 dígitos. Verifique sua caixa de entrada e spam.';
          }
        } catch {
          showForgotMsg('Erro de conexão com o servidor.', true);
        }
      });
    }

    const resendResetBtn = document.getElementById('btn-gate-resend-reset');
    if (resendResetBtn) {
      resendResetBtn.addEventListener('click', async () => {
        const email = (document.getElementById('reset-target-email') as HTMLInputElement | null)?.value || '';
        const feedback = document.getElementById('reset-feedback');
        const showResetMsg = (msg: string, isErr = false) => {
          if (!feedback) return;
          feedback.style.display = 'block';
          feedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
          feedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
          feedback.textContent = msg;
        };
        if (!email) return;
        showResetMsg('Enviando novo código de recuperação...', false);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resend_otp', email, purpose: 'reset_password' }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            if (data.remainingCooldown) startOtpCooldownTimer(data.remainingCooldown, 'btn-gate-resend-reset');
            showResetMsg(data.error || 'Aguarde antes de reenviar.', true);
            return;
          }
          clearAndFocusResetOtpBoxes();
          startOtpCooldownTimer(data.cooldownSeconds || 60, 'btn-gate-resend-reset');
          showResetMsg('Novo código de recuperação enviado! O anterior foi invalidado.', false);
        } catch {
          showResetMsg('Erro ao reenviar código de recuperação.', true);
        }
      });
    }

    const formReset = document.getElementById('form-auth-reset');
    if (formReset) {
      formReset.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('reset-target-email') as HTMLInputElement | null)?.value || '';
        const code = getEnteredResetOtpCode();
        const newPassword = (document.getElementById('reset-new-password') as HTMLInputElement | null)?.value || '';
        const confirmPassword =
          (document.getElementById('reset-confirm-password') as HTMLInputElement | null)?.value || '';
        const feedback = document.getElementById('reset-feedback');
        const showResetMsg = (msg: string, isErr = false) => {
          if (!feedback) return;
          feedback.style.display = 'block';
          feedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
          feedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
          feedback.textContent = msg;
        };

        if (code.length !== 6) {
          showResetMsg('Preencha todos os 6 dígitos do código de recuperação.', true);
          return;
        }
        if (newPassword.length < 8) {
          showResetMsg('A nova senha deve ter pelo menos 8 caracteres.', true);
          return;
        }
        if (newPassword !== confirmPassword) {
          showResetMsg('As senhas digitadas não conferem. Verifique e tente novamente.', true);
          return;
        }

        showResetMsg('Validando código e salvando nova senha...', false);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_password', email, code, newPassword }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            showResetMsg(data.error || 'Não foi possível redefinir a senha.', true);
            if (data.locked || data.expired) {
              clearAndFocusResetOtpBoxes();
            }
            return;
          }

          if (otpCooldownInterval) {
            clearInterval(otpCooldownInterval);
            otpCooldownInterval = null;
          }
          const newPwInput = document.getElementById('reset-new-password') as HTMLInputElement | null;
          const confirmPwInput = document.getElementById('reset-confirm-password') as HTMLInputElement | null;
          if (newPwInput) newPwInput.value = '';
          if (confirmPwInput) confirmPwInput.value = '';
          resetAllPasswordVisibilities();

          if (data.user) {
            applyAuthenticatedUser(data.user, data.state, true, 'reset_password');
            deps.showUndoToast('Senha redefinida com sucesso! Você já está conectado(a).');
          } else {
            setAuthGateMode('login');
            const gateEmail = document.getElementById('gate-email') as HTMLInputElement | null;
            if (gateEmail) gateEmail.value = email;
            const gateFeedback = document.getElementById('gate-feedback');
            if (gateFeedback) {
              gateFeedback.style.display = 'block';
              gateFeedback.style.background = 'var(--green-soft)';
              gateFeedback.style.color = 'var(--green-emerald)';
              gateFeedback.textContent = 'Senha redefinida com sucesso! Entre com sua nova senha.';
            }
          }
        } catch {
          showResetMsg('Erro de rede ao redefinir a senha.', true);
        }
      });
    }

    const openBtn = document.getElementById('btn-open-auth');
    if (openBtn) {
      openBtn.addEventListener('click', () => openAuthModal());
    }

    document.querySelectorAll<HTMLElement>('[data-auth-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.authTab || 'login';
        const modeInput = document.getElementById('auth-mode') as HTMLInputElement | null;
        const nameGroup = document.getElementById('auth-name-group');
        const pwInput = document.getElementById('auth-password');
        const modalForgot = document.getElementById('btn-modal-auth-forgot');
        const submitBtn = document.getElementById('btn-auth-submit');
        const feedback = document.getElementById('auth-feedback');
        if (modeInput) modeInput.value = mode;
        document.querySelectorAll<HTMLElement>('[data-auth-tab]').forEach((b) => {
          const isAct = b.dataset.authTab === mode;
          b.classList.toggle('active', isAct);
          b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
        });
        if (nameGroup) nameGroup.style.display = mode === 'register' ? 'flex' : 'none';
        if (modalForgot) modalForgot.style.display = mode === 'register' ? 'none' : 'inline-block';
        if (pwInput) {
          pwInput.setAttribute('autocomplete', mode === 'register' ? 'new-password' : 'current-password');
          pwInput.setAttribute('placeholder', mode === 'register' ? 'Mínimo 8 caracteres' : 'Digite sua senha');
        }
        setPasswordFieldVisibility('auth-password', false);
        if (submitBtn) submitBtn.textContent = mode === 'register' ? 'Criar minha conta' : 'Entrar na conta';
        if (feedback) feedback.style.display = 'none';
      });
    });

    const logoutBtn = document.getElementById('btn-auth-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' }),
        }).catch(() => {});
        cloudSessionUser = null;
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        }
        updateAuthHeaderBadge();
        deps.closeFarolModal('modal-auth', true);
        setAuthGateMode('login');
        setAuthGateVisibility(true);
      });
    }

    const formAuth = document.getElementById('form-auth');
    if (formAuth) {
      formAuth.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('auth-feedback');
        const showMsg = (msg: string, isError = false) => {
          if (!feedback) return;
          feedback.style.display = 'block';
          feedback.style.background = isError ? 'var(--coral-soft)' : 'var(--green-soft)';
          feedback.style.color = isError ? 'var(--coral-red)' : 'var(--green-emerald)';
          feedback.textContent = msg;
        };

        if (cloudSessionUser && cloudSessionUser.email) {
          await syncStateToCloud();
          showMsg('Dados e contas sincronizados com sucesso no PostgreSQL!');
          return;
        }

        const st = deps.getState();
        const action = (document.getElementById('auth-mode') as HTMLInputElement | null)?.value || 'login';
        const name =
          (document.getElementById('auth-name') as HTMLInputElement | null)?.value?.trim() ||
          st?.profile?.name ||
          'Minha Conta';
        const email = (document.getElementById('auth-email') as HTMLInputElement | null)?.value?.trim() || '';
        const password = (document.getElementById('auth-password') as HTMLInputElement | null)?.value || '';

        showMsg('Conectando ao banco de dados...', false);

        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, name, email, password, state: st }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            showMsg(data.error || 'Não foi possível autenticar.', true);
            return;
          }

          if (data.step === 'verify_otp') {
            deps.closeFarolModal('modal-auth', true);
            setAuthGateVisibility(true);
            showOtpVerificationStep(data);
            return;
          }

          applyAuthenticatedUser(data.user, data.state, true);
          deps.closeFarolModal('modal-auth');
          deps.showUndoToast(`Conectado como ${data.user.email}. Dados salvos na nuvem!`);
        } catch {
          showMsg('Erro de conexão com o servidor.', true);
        }
      });
    }
  }

  async function hydrateFromCloud(): Promise<void> {
    try {
      const authRes = await fetch('/api/auth');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData && authData.authenticated && authData.user) {
          cloudSessionUser = authData.user;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authData.user));
          }
          const switchedUser = deps.getUsersIndex().activeUserId !== authData.user.id;
          ensureUserInIndex(authData.user);
          if (switchedUser) {
            deps.setState(deps.loadStateForUser(authData.user.id, authData.user.name));
          }
          updateAuthHeaderBadge();
          setAuthGateVisibility(false);
        } else {
          cloudSessionUser = null;
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          }
          updateAuthHeaderBadge();
          setAuthGateVisibility(!isLocalTourPreviewMode());
          return;
        }
      }

      if (!cloudSessionUser) return;

      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok) {
        const { nextState, shouldSync, migratedFromDefault } = resolveAuthenticatedWorkspaceState(
          cloudSessionUser,
          data.state || null
        );
        deps.setState(nextState);
        if (typeof window !== 'undefined') {
          try {
            if (!nextState.updatedAt) nextState.updatedAt = Date.now();
            window.localStorage.setItem(
              deps.getUserStorageKey(deps.getUsersIndex().activeUserId),
              JSON.stringify(nextState)
            );
          } catch {}
        }
        deps.renderApp();
        if (shouldSync) {
          syncStateToCloud();
        }
        if (migratedFromDefault) {
          deps.showUndoToast('Seus dados locais anteriores foram recuperados para sua conta!');
        }
      }
    } catch {
      if (isLocalTourPreviewMode()) {
        setAuthGateVisibility(false);
      }
    }
  }

  return {
    getCloudSessionUser,
    setCloudSessionUser,
    setAuthGateVisibility,
    startOtpCooldownTimer,
    showOtpVerificationStep,
    showForgotPasswordStep,
    showResetPasswordStep,
    setAuthGateMode,
    resolveAuthenticatedWorkspaceState,
    ensureUserInIndex,
    applyAuthenticatedUser,
    updateAuthHeaderBadge,
    openAuthModal,
    bindAuthEvents,
    syncStateToCloud,
    hydrateFromCloud,
  };
}
