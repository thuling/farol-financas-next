export const FAROL_SHELL_HTML = `<!-- ==================== TELA INICIAL DE LOGIN / CRIAR CONTA (AUTH GATE) ==================== -->
  <section class="auth-gate-screen" id="auth-gate-screen">
    <div class="auth-gate-stage">
      <!-- Card Esquerdo (Formulário sobreposto ao painel direito, fiel à referência) -->
      <div class="auth-gate-form-card" id="auth-gate-form-card">
        <div class="auth-gate-brand-mini">
          <div class="brand-logo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v2"/><path d="M12 8a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4Z"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 6.34 1.41-1.41"/>
            </svg>
          </div>
          <span>Farol Finanças</span>
        </div>

        <h2 class="auth-gate-title" id="auth-gate-title">Acesse sua conta</h2>

        <form id="form-auth-gate" class="auth-gate-form">
          <input type="hidden" id="gate-mode" value="login" />

          <div class="auth-gate-input-box" id="gate-name-wrap" style="display:none;">
            <span class="auth-gate-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span class="auth-gate-sep"></span>
            <input type="text" id="gate-name" class="auth-gate-input" placeholder="Digite seu nome completo" autocomplete="name" />
          </div>

          <div class="auth-gate-input-box">
            <span class="auth-gate-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </span>
            <span class="auth-gate-sep"></span>
            <input type="email" id="gate-email" class="auth-gate-input" placeholder="Digite seu e-mail" autocomplete="email" required />
          </div>

          <div class="auth-gate-input-box">
            <span class="auth-gate-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
              </svg>
            </span>
            <span class="auth-gate-sep"></span>
            <input type="password" id="gate-password" class="auth-gate-input" placeholder="Digite sua senha" autocomplete="current-password" required />
          </div>

          <div class="auth-gate-meta-row" id="gate-meta-row">
            <label class="auth-gate-remember">
              <input type="checkbox" id="gate-remember" checked />
              <span>Lembrar de mim</span>
            </label>
            <button type="button" class="auth-gate-link" id="gate-switch-inline">Criar conta grátis</button>
          </div>

          <div id="gate-feedback" class="auth-gate-feedback" style="display:none;"></div>

          <div class="auth-gate-submit-wrap">
            <button type="submit" class="auth-gate-submit-btn" id="gate-submit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
              </svg>
              <span id="gate-submit-label">ENTRAR</span>
            </button>
          </div>
        </form>

        <!-- Etapa 2: Verificação de Código OTP de 6 Dígitos (Cadastro & Login 2FA) -->
        <form id="form-auth-otp" class="auth-gate-form" style="display:none;">
          <input type="hidden" id="otp-target-email" value="" />
          <input type="hidden" id="otp-purpose" value="login" />

          <div class="otp-step-header">
            <span class="otp-badge-pill" id="otp-badge-label">Verificação em 2 Etapas (2FA)</span>
            <p class="otp-step-desc" id="otp-step-desc">
              Digite o código de 6 dígitos enviado para <b id="otp-email-display">seu@email.com</b>
            </p>
          </div>

          <div class="otp-digits-row" id="otp-digits-row">
            <input type="text" inputmode="numeric" maxlength="1" class="otp-digit-box" data-otp-idx="0" autocomplete="one-time-code" aria-label="Dígito 1" />
            <input type="text" inputmode="numeric" maxlength="1" class="otp-digit-box" data-otp-idx="1" aria-label="Dígito 2" />
            <input type="text" inputmode="numeric" maxlength="1" class="otp-digit-box" data-otp-idx="2" aria-label="Dígito 3" />
            <input type="text" inputmode="numeric" maxlength="1" class="otp-digit-box" data-otp-idx="3" aria-label="Dígito 4" />
            <input type="text" inputmode="numeric" maxlength="1" class="otp-digit-box" data-otp-idx="4" aria-label="Dígito 5" />
            <input type="text" inputmode="numeric" maxlength="1" class="otp-digit-box" data-otp-idx="5" aria-label="Dígito 6" />
          </div>

          <div class="otp-timer-row">
            <span style="font-size:11.5px; color:var(--text-muted);">Expira em 10 min · Máx. 3 tentativas</span>
            <button type="button" class="auth-gate-link" id="btn-gate-resend-otp" disabled>
              Reenviar código (60s)
            </button>
          </div>

          <div id="otp-feedback" class="auth-gate-feedback" style="display:none;"></div>

          <div class="auth-gate-submit-wrap" style="flex-direction:column; gap:10px; align-items:center;">
            <button type="submit" class="auth-gate-submit-btn" id="btn-gate-verify-otp" style="width:100%;">
              ✓ VALIDAR CÓDIGO E ACESSAR
            </button>
            <button type="button" class="auth-gate-link" id="btn-gate-otp-back" style="font-size:12px;">
              ← Voltar e alterar e-mail ou senha
            </button>
          </div>
        </form>
      </div>

      <!-- Painel Direito (Hero com Ondas Fluídas na Paleta Farol, fiel à referência) -->
      <div class="auth-gate-hero-card">
        <svg class="auth-gate-waves-svg" viewBox="0 0 500 600" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="farolWaveBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0f2940" />
              <stop offset="50%" stop-color="#18476b" />
              <stop offset="100%" stop-color="#0b1f32" />
            </linearGradient>
            <linearGradient id="farolBlob1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#38b6ff" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.18" />
            </linearGradient>
            <linearGradient id="farolBlob2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#56c2f6" stop-opacity="0.38" />
              <stop offset="100%" stop-color="#153752" stop-opacity="0.55" />
            </linearGradient>
            <linearGradient id="farolBlob3" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="#091724" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#2b6cb0" stop-opacity="0.35" />
            </linearGradient>
          </defs>
          <rect width="500" height="600" fill="url(#farolWaveBg)" />
          <path d="M -40,-20 L 380,-20 C 430,110 380,260 280,290 C 170,320 110,220 20,260 C -40,285 -40,150 -40,-20 Z" fill="url(#farolBlob1)" />
          <path d="M 520,160 C 410,180 390,340 450,430 C 490,490 520,460 520,380 Z" fill="url(#farolBlob2)" />
          <path d="M -30,520 C 60,390 220,370 340,440 C 440,498 480,560 520,620 L -30,620 Z" fill="url(#farolBlob3)" />
          <circle cx="10" cy="310" r="68" fill="url(#farolBlob2)" />
        </svg>

        <div class="auth-gate-hero-content">
          <h3 class="auth-gate-hero-title" id="gate-hero-title">BEM-VINDO!</h3>
          <p class="auth-gate-hero-sub" id="gate-hero-sub">
            Insira seus dados e comece sua jornada financeira conosco no Farol
          </p>
          <button type="button" class="auth-gate-hero-btn" id="gate-hero-toggle-btn">
            CRIAR CONTA
          </button>
        </div>
      </div>
    </div>
  </section>

  <div class="app-shell" id="main-app-shell" style="display:none;">
    <!-- ==================== SIDEBAR ==================== -->
    <aside class="sidebar">
      <div class="sidebar-top-group">
        <div class="brand">
          <div class="brand-logo" title="Farol Finanças">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18h6"/>
              <path d="M10 22h4"/>
              <path d="M12 2v2"/>
              <path d="M12 8a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4Z"/>
              <path d="m4.93 4.93 1.41 1.41"/>
              <path d="m17.66 6.34 1.41-1.41"/>
            </svg>
          </div>
          <span class="brand-name">Farol</span>
        </div>

        <div class="sidebar-nav-scroll">
          <div class="nav-section-label">PRINCIPAL</div>
          <ul class="nav-list" id="nav-principal">
            <li>
              <button class="nav-item active" data-tab="visao-geral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Visão geral</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="transacoes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
                <span>Transações</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="recorrencias">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                <span>Recorrências</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="fluxo-caixa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                <span>Fluxo de caixa</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="faturas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                <span>Faturas</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="categorias">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                <span>Categorias</span>
              </button>
            </li>
          </ul>

          <div class="nav-section-label" style="margin-top: 10px;">VISÃO ESTRATÉGICA</div>
          <ul class="nav-list" id="nav-estrategica">
            <li>
              <button class="nav-item" data-tab="metas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                <span>Metas</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="patrimonio">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                <span>Patrimônio</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="projecao">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                <span>Projeção</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="contas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
                <span>Contas</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Perfil do Usuário -->
      <div class="sidebar-footer" id="profile-trigger" title="Clique para editar seu perfil e orçamento mensal">
        <div class="avatar-circle" id="user-avatar">M</div>
        <div class="user-meta">
          <span class="user-name" id="user-name-label">Meu nome</span>
          <span class="user-plan" id="user-plan-label">Plano pessoal</span>
        </div>
      </div>
    </aside>

    <!-- ==================== MAIN CONTENT AREA ==================== -->
    <main class="main-area">
      <!-- Topbar -->
      <header class="topbar">
        <div>
          <h1 class="page-title" id="page-title">Visão geral</h1>
          <p class="page-subtitle" id="page-subtitle">Novembro de 2026 · 18 dias restantes</p>
        </div>

        <div class="topbar-actions">
          <!-- Seletor de Mês -->
          <select id="month-selector" class="month-pill" aria-label="Selecionar mês">
            <option value="2026-01">janeiro de 2026 ▾</option>
            <option value="2026-02">fevereiro de 2026 ▾</option>
            <option value="2026-03">março de 2026 ▾</option>
            <option value="2026-04">abril de 2026 ▾</option>
            <option value="2026-05">maio de 2026 ▾</option>
            <option value="2026-06">junho de 2026 ▾</option>
            <option value="2026-07">julho de 2026 ▾</option>
            <option value="2026-08">agosto de 2026 ▾</option>
            <option value="2026-09">setembro de 2026 ▾</option>
            <option value="2026-10">outubro de 2026 ▾</option>
            <option value="2026-11" selected>novembro de 2026 ▾</option>
            <option value="2026-12">dezembro de 2026 ▾</option>
            <option value="2027-01">janeiro de 2027 ▾</option>
            <option value="2027-02">fevereiro de 2027 ▾</option>
            <option value="2027-03">março de 2027 ▾</option>
            <option value="2027-04">abril de 2027 ▾</option>
            <option value="2027-05">maio de 2027 ▾</option>
            <option value="2027-06">junho de 2027 ▾</option>
            <option value="2027-07">julho de 2027 ▾</option>
            <option value="2027-08">agosto de 2027 ▾</option>
            <option value="2027-09">setembro de 2027 ▾</option>
            <option value="2027-10">outubro de 2027 ▾</option>
            <option value="2027-11">novembro de 2027 ▾</option>
            <option value="2027-12">dezembro de 2027 ▾</option>
          </select>

          <!-- Botão Conta na Nuvem (Login / Cadastro PostgreSQL) -->
          <button class="month-pill" id="btn-open-auth" title="Entrar ou criar conta na nuvem (Banco de Dados PostgreSQL)" style="display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-weight:600;">
            <span id="auth-status-dot" style="width:7px; height:7px; border-radius:50%; background:var(--amber-gold); display:inline-block;"></span>
            <span id="auth-btn-label">Entrar / Criar Conta</span>
          </button>

          <!-- Botão Tema Claro / Escuro -->
          <button class="icon-circle-btn" id="theme-toggle-btn" title="Alternar tema claro/escuro" aria-label="Alternar tema">
            <svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          </button>

          <!-- Botão Ocultar/Mostrar Valores -->
          <button class="icon-circle-btn" id="privacy-toggle-btn" title="Mostrar/Ocultar valores">
            <svg id="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>

          <!-- Botão Nova Transação (+) -->
          <button class="add-circle-btn" id="quick-add-btn" title="Adicionar lançamento (+)">+</button>
        </div>
      </header>

      <!-- Container Dinâmico das Abas -->
      <div id="view-container"></div>
    </main>
  </div>

  <!-- ==================== MODAL: LANÇAMENTO RÁPIDO / EDITAR TRANSAÇÃO ==================== -->
  <div class="modal-backdrop" id="modal-transaction">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-tx-title">Lançamento rápido</h3>
            <p class="modal-subtitle">Registre entradas, saídas à vista ou parceladas no cartão</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-transaction" aria-label="Fechar">✕</button>
      </div>
      <form id="form-transaction">
        <div class="modal-body">
          <input type="hidden" id="tx-id" />
          <input type="hidden" id="tx-category" />

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Valor</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0.01" id="tx-amount" class="form-input" placeholder="0,00" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select id="tx-type" class="form-select" style="display:none;">
                <option value="expense">Saída</option>
                <option value="income">Entrada</option>
              </select>
              <div class="pro-seg-group" data-seg-for="tx-type">
                <button type="button" class="pro-seg-btn active" data-seg-val="expense">
                  <span class="seg-dot red"></span>Saída
                </button>
                <button type="button" class="pro-seg-btn" data-seg-val="income">
                  <span class="seg-dot green"></span>Entrada
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Categoria (mais usadas primeiro)</label>
            <div id="quick-cat-chips" class="quick-cat-chips"></div>
          </div>

          <details class="quick-more-details" id="quick-more-details" open>
            <summary>Detalhes do lançamento (descrição, conta, data e método)</summary>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Descrição</label>
                <div class="field-box">
                  <span class="field-prefix">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
                  </span>
                  <input type="text" id="tx-desc" class="form-input" placeholder="Ex: iFood / Mercado" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Tag (opcional)</label>
                <div class="field-box">
                  <span class="field-prefix">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  </span>
                  <input type="text" id="tx-tag" class="form-input" placeholder="Ex: trabalho, viagem" />
                </div>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Conta / Cartão</label>
                <div class="field-box">
                  <span class="field-prefix">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </span>
                  <select id="tx-account" class="form-select" required></select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Data</label>
                <div class="field-box">
                  <span class="field-prefix">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  </span>
                  <input type="date" id="tx-date" class="form-input" required />
                </div>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Método</label>
                <div class="field-box">
                  <span class="field-prefix">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/></svg>
                  </span>
                  <select id="tx-method" class="form-select">
                    <option value="Conta Corrente / Pix">Pix / Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </select>
                </div>
              </div>
              <div class="form-group" id="tx-installments-wrap" style="display:none;">
                <label class="form-label">Parcelas</label>
                <div class="field-box">
                  <select id="tx-installments" class="form-select">
                    <option value="1">1x (À vista)</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="4">4x</option>
                    <option value="5">5x</option>
                    <option value="6">6x</option>
                    <option value="7">7x</option>
                    <option value="8">8x</option>
                    <option value="9">9x</option>
                    <option value="10">10x</option>
                    <option value="11">11x</option>
                    <option value="12">12x</option>
                    <option value="15">15x</option>
                    <option value="18">18x</option>
                    <option value="21">21x</option>
                    <option value="24">24x</option>
                  </select>
                  <span id="tx-installment-preview" class="field-suffix" style="color:var(--cyan-accent);"></span>
                </div>
              </div>
            </div>
            <label class="pro-checkbox-row">
              <input type="checkbox" id="tx-is-recurring" />
              <span>Repetir mensalmente (salvar em Recorrências)</span>
            </label>
          </details>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-transaction" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-transaction">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: PERFIL & ORÇAMENTO ==================== -->
  <div class="modal-backdrop" id="modal-profile">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title">Configurações & orçamento</h3>
            <p class="modal-subtitle">Perfis isolados, salário mensal fixo e metas financeiras</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-profile" aria-label="Fechar">✕</button>
      </div>
      <form id="form-profile">
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Usuário ativo (dados isolados)</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </span>
                <select id="prof-user-select" class="form-select"></select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Novo usuário</label>
              <div style="display:flex; gap:8px;">
                <div class="field-box" style="flex:1;">
                  <input type="text" id="prof-new-user" class="form-input" placeholder="Ex: Maria" />
                </div>
                <button type="button" class="btn-secondary" id="btn-create-user" style="white-space:nowrap; height:44px;">+ Criar</button>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Seu nome</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
                </span>
                <input type="text" id="prof-name" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Plano / subtítulo</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </span>
                <input type="text" id="prof-plan" class="form-input" required />
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Salário mensal fixo</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0" id="prof-salary" class="form-input" placeholder="0,00" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dia do recebimento</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </span>
                <input type="number" min="1" max="31" id="prof-salary-day" class="form-input" value="5" />
                <span class="field-suffix">de 1<br/>a 31</span>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Orçamento mensal</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0" id="prof-budget" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Meta reserva de emergência</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="1" id="prof-reserve-goal" class="form-input" required />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-reset-demo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Restaurar modelo
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-profile">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: EDITAR FATURA / CARTÃO ==================== -->
  <div class="modal-backdrop" id="modal-invoice">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-inv-title">Editar fatura</h3>
            <p class="modal-subtitle">Gerencie limite, datas de fechamento/vencimento e status do ciclo</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-invoice" aria-label="Fechar">✕</button>
      </div>
      <form id="form-invoice">
        <div class="modal-body">
          <input type="hidden" id="inv-account-id" />
          <div class="form-group">
            <label class="form-label">Nome do cartão / conta</label>
            <div class="field-box">
              <span class="field-prefix">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </span>
              <input type="text" id="inv-name" class="form-input" placeholder="Ex: Nubank, Mercado Pago" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Status da fatura</label>
            <select id="inv-status" class="form-select" style="display:none;">
              <option value="open">Aberta</option>
              <option value="closed">Fechada</option>
              <option value="paid">Paga</option>
            </select>
            <div class="pro-seg-group cols-3" data-seg-for="inv-status">
              <button type="button" class="pro-seg-btn active" data-seg-val="open">
                <span class="seg-dot cyan"></span>Aberta
              </button>
              <button type="button" class="pro-seg-btn" data-seg-val="closed">
                <span class="seg-dot amber"></span>Fechada
              </button>
              <button type="button" class="pro-seg-btn" data-seg-val="paid">
                <span class="seg-dot green"></span>Paga
              </button>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Limite total</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="1" id="inv-limit" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Ajuste / valor avulso</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" id="inv-manual-adj" class="form-input" placeholder="0,00" />
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Dia de fechamento</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </span>
                <input type="number" min="1" max="31" id="inv-closing-day" class="form-input" required />
                <span class="field-suffix">de 1<br/>a 31</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dia de vencimento</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </span>
                <input type="number" min="1" max="31" id="inv-due-day" class="form-input" required />
                <span class="field-suffix">de 1<br/>a 31</span>
              </div>
            </div>
          </div>

          <div class="modal-live-summary">
            <div class="modal-live-cell">
              <div class="modal-live-label">CICLO DE COBRANÇA</div>
              <div class="modal-live-val" id="inv-live-cycle">Fecha dia 27 · Vence dia 12</div>
            </div>
            <div class="modal-live-cell">
              <div class="modal-live-label">LIMITE CONFIGURADO</div>
              <div class="modal-live-val" id="inv-live-limit">R$ 0,00</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-invoice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-invoice">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: ATIVO / PATRIMÔNIO ==================== -->
  <div class="modal-backdrop" id="modal-asset">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-asset-title">Editar ativo</h3>
            <p class="modal-subtitle">Configure saldo, rentabilidade % do CDI e faixas com limite promocional</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-asset" aria-label="Fechar">✕</button>
      </div>
      <form id="form-asset">
        <div class="modal-body">
          <input type="hidden" id="ast-id" />
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Nome do ativo</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
                </span>
                <input type="text" id="ast-name" class="form-input" placeholder="Ex: CDB Liquidez Diária" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Classe</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </span>
                <select id="ast-category" class="form-select">
                  <option value="Renda Fixa (CDB)">Renda Fixa (CDB)</option>
                  <option value="Tesouro Direto">Tesouro Direto</option>
                  <option value="FIIs">FIIs</option>
                  <option value="Ações">Ações</option>
                  <option value="Cripto">Cripto</option>
                  <option value="Reserva / Outros">Reserva / Outros</option>
                </select>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Saldo atual</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0" id="ast-amount" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Rentabilidade principal</label>
              <div class="field-box">
                <input type="number" step="0.5" min="0" max="500" id="ast-cdb-pct" class="form-input" placeholder="100" required />
                <span class="field-suffix">% CDI</span>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Instituição</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                </span>
                <input type="text" id="ast-institution" class="form-input" placeholder="Ex: Mercado Pago, Nubank" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Liquidez</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <select id="ast-liquidity" class="form-select">
                  <option value="Diária">Liquidez Diária</option>
                  <option value="D+1">D+1</option>
                  <option value="D+30">D+30</option>
                  <option value="No Vencimento">No Vencimento</option>
                </select>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Teto da taxa principal (opcional)</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0" id="ast-promo-cap" class="form-input" placeholder="0,00 (sem teto)" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Taxa acima do teto</label>
              <div class="field-box">
                <input type="number" step="0.5" min="0" max="500" id="ast-excess-pct" class="form-input" placeholder="100" />
                <span class="field-suffix">% CDI</span>
              </div>
            </div>
          </div>

          <div class="modal-live-summary">
            <div class="modal-live-cell">
              <div class="modal-live-label">RENDIMENTO MENSAL EST.</div>
              <div class="modal-live-val" id="ast-live-monthly">+R$ 0,00</div>
            </div>
            <div class="modal-live-cell">
              <div class="modal-live-label">PROJEÇÃO ANUAL BRUTA</div>
              <div class="modal-live-val" id="ast-live-annual">+R$ 0,00</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-asset">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-asset">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: CATEGORIA & REGRAS AUTOMÁTICAS ==================== -->
  <div class="modal-backdrop" id="modal-category">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-cat-title">Nova categoria</h3>
            <p class="modal-subtitle">Defina o teto de gastos mensal e palavras-chave de identificação automática</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-category" aria-label="Fechar">✕</button>
      </div>
      <form id="form-category">
        <div class="modal-body">
          <input type="hidden" id="cat-id" />
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Nome da categoria</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
                </span>
                <input type="text" id="cat-name" class="form-input" placeholder="Ex: Delivery" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Cor de identificação</label>
              <div class="field-box">
                <input type="color" id="cat-color" class="form-input" style="height:28px; padding:0; cursor:pointer;" value="#38b6ff" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Orçamento mensal</label>
            <div class="field-box">
              <span class="field-prefix">R$</span>
              <input type="number" step="0.01" min="0" id="cat-budget" class="form-input" placeholder="150,00" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Regras automáticas (palavras-chave separadas por vírgula)</label>
            <div class="field-box">
              <span class="field-prefix">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" id="cat-rules" class="form-input" placeholder="Ex: ifood, rappi, lanche, pizza" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-archive-category">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            Arquivar
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-category">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: NOVA / EDITAR RECORRÊNCIA ==================== -->
  <div class="modal-backdrop" id="modal-recurrence">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-rec-title">Editar recorrência</h3>
            <p class="modal-subtitle">Assinaturas e contas fixas lançadas todo mês</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-recurrence" aria-label="Fechar">✕</button>
      </div>
      <form id="form-recurrence">
        <div class="modal-body">
          <input type="hidden" id="rec-id" />
          <div class="form-group">
            <label class="form-label">Nome</label>
            <div class="field-box">
              <span class="field-prefix">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
              </span>
              <input type="text" id="rec-desc" class="form-input" placeholder="Ex: Academia, Aluguel, Internet" required />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Valor mensal</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0.01" id="rec-amount" class="form-input" placeholder="45,00" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dia do vencimento</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </span>
                <input type="number" min="1" max="31" id="rec-day" class="form-input" value="10" required />
                <span class="field-suffix">de 1<br/>a 31</span>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select id="rec-type" class="form-select" style="display:none;">
                <option value="expense">Saída</option>
                <option value="income">Entrada</option>
              </select>
              <div class="pro-seg-group" data-seg-for="rec-type">
                <button type="button" class="pro-seg-btn active" data-seg-val="expense">
                  <span class="seg-dot red"></span>Saída
                </button>
                <button type="button" class="pro-seg-btn" data-seg-val="income">
                  <span class="seg-dot green"></span>Entrada
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </span>
                <select id="rec-category" class="form-select"></select>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Conta / Cartão</label>
            <div class="field-box">
              <span class="field-prefix">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </span>
              <select id="rec-account" class="form-select"></select>
            </div>
          </div>

          <div class="modal-live-summary">
            <div class="modal-live-cell">
              <div class="modal-live-label">PRÓXIMA COBRANÇA</div>
              <div class="modal-live-val" id="rec-live-next">10 de dez de 2026</div>
            </div>
            <div class="modal-live-cell">
              <div class="modal-live-label">IMPACTO ANUAL</div>
              <div class="modal-live-val" id="rec-live-annual">R$ 0,00</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-recurrence" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-recurrence">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: NOVA CONTA / CARTÃO ==================== -->
  <div class="modal-backdrop" id="modal-account">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-acc-title">Nova conta ou cartão</h3>
            <p class="modal-subtitle">Configure contas correntes, cartões de crédito ou bancos híbridos</p>
          </div>
        </div>
        <button type="button" class="modal-close-modal modal-close-btn" data-close-modal="modal-account" aria-label="Fechar">✕</button>
      </div>
      <form id="form-account">
        <div class="modal-body">
          <input type="hidden" id="acc-id" />
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Nome do banco ou cartão</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
                </span>
                <input type="text" id="acc-name" class="form-input" placeholder="Ex: Nubank, Mercado Pago" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Modalidade</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </span>
                <select id="acc-type" class="form-select">
                  <option value="Conta + Cartão">Conta + Cartão</option>
                  <option value="Conta Corrente">Conta Corrente</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Saldo inicial</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" id="acc-balance" class="form-input" value="0.00" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Limite disponível</label>
              <div class="field-box">
                <span class="field-prefix">R$</span>
                <input type="number" step="0.01" min="0" id="acc-limit" class="form-input" value="3000.00" />
              </div>
            </div>
          </div>
          <div class="form-row-2" id="acc-card-dates-row">
            <div class="form-group">
              <label class="form-label">Dia de fechamento</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </span>
                <input type="number" min="1" max="31" id="acc-closing-day" class="form-input" value="5" />
                <span class="field-suffix">de 1<br/>a 31</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dia de vencimento</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </span>
                <input type="number" min="1" max="31" id="acc-due-day" class="form-input" value="12" />
                <span class="field-suffix">de 1<br/>a 31</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-account">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-account">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: DIÁLOGO ESTILIZADO (CONFIRMAÇÃO / INPUT) ==================== -->
  <div class="modal-backdrop" id="modal-dialog">
    <div class="modal-card" style="max-width:440px;">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="dialog-title">Confirmar ação</h3>
            <p class="modal-subtitle">Verifique os dados antes de prosseguir</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" id="dialog-close-x" aria-label="Fechar">✕</button>
      </div>
      <form id="form-dialog">
        <div class="modal-body">
          <p id="dialog-message" style="font-size:13.5px; color:var(--text-secondary); line-height:1.5; margin-bottom:14px;"></p>
          <div class="form-group" id="dialog-input-wrap" style="display:none; margin-bottom:0;">
            <label class="form-label" id="dialog-input-label">Valor</label>
            <div class="field-box">
              <span class="field-prefix">R$</span>
              <input type="text" id="dialog-input" class="form-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" id="dialog-cancel-btn">Cancelar</button>
            <button type="submit" class="btn-primary" id="dialog-confirm-btn">Confirmar</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: CONTA NA NUVEM (LOGIN / CADASTRO POSTGRESQL) ==================== -->
  <div class="modal-backdrop" id="modal-auth">
    <div class="modal-card" style="max-width:460px;">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title" id="modal-auth-title">Conta na Nuvem</h3>
            <p class="modal-subtitle">Salve suas contas bancárias, cartões e lançamentos no banco PostgreSQL</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-auth" aria-label="Fechar">✕</button>
      </div>
      <form id="form-auth">
        <div class="modal-body">
          <input type="hidden" id="auth-mode" value="login" />

          <div id="auth-logged-view" style="display:none;">
            <div class="modal-live-summary" style="grid-template-columns:1fr; margin-bottom:14px;">
              <div class="modal-live-cell">
                <div class="modal-live-label">CONECTADO NA NUVEM (POSTGRESQL)</div>
                <div class="modal-live-val" id="auth-logged-email">usuario@email.com</div>
                <div style="font-size:11.5px; color:var(--green-emerald); margin-top:4px;">✓ Sincronização automática ativa em todos os dispositivos</div>
              </div>
            </div>
          </div>

          <div id="auth-form-fields">
            <div class="form-group">
              <label class="form-label">Acesso</label>
              <div class="pro-seg-group" id="auth-seg-group">
                <button type="button" class="pro-seg-btn active" data-auth-tab="login">
                  <span class="seg-dot cyan"></span>Entrar
                </button>
                <button type="button" class="pro-seg-btn" data-auth-tab="register">
                  <span class="seg-dot green"></span>Criar Conta
                </button>
              </div>
            </div>

            <div class="form-group" id="auth-name-group" style="display:none;">
              <label class="form-label">Seu nome</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input type="text" id="auth-name" class="form-input" placeholder="Ex: Arthur" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">E-mail</label>
              <div class="field-box">
                <span class="field-prefix">@</span>
                <input type="email" id="auth-email" class="form-input" placeholder="seu@email.com" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Senha</label>
              <div class="field-box">
                <span class="field-prefix">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type="password" id="auth-password" class="form-input" placeholder="Mínimo 4 caracteres" required />
              </div>
            </div>
          </div>

          <div id="auth-feedback" style="display:none; font-size:12.5px; padding:10px 12px; border-radius:10px; margin-top:6px;"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-auth-logout" style="display:none;">Sair da conta</button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-auth">Fechar</button>
            <button type="submit" class="btn-primary" id="btn-auth-submit">Entrar na conta</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: UPLOAD E REVISÃO INTELIGENTE DE FATURA (CSV / PDF / IMAGEM) ==================== -->
  <div class="modal-backdrop" id="modal-import-invoice">
    <div class="modal-card" style="max-width:940px;">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h3 class="modal-title">Importar Fatura ou Extrato (CSV, MD, PDF ou Imagem)</h3>
            <p class="modal-subtitle">Leitura completa de Markdown (.md), CSV, PDF e imagens com extração de parcelas (X/Y), estornos e revisão editável</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-import-invoice" aria-label="Fechar">✕</button>
      </div>

      <div class="modal-body" style="gap:14px;">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Arquivo da fatura (.csv, .md, .pdf, .png, .jpg)</label>
            <div class="field-box" style="padding:6px 10px;">
              <input type="file" id="imp-file-input" accept=".csv,.md,.markdown,.pdf,.png,.jpg,.jpeg,.webp,.ofx,.txt" class="form-input" style="font-size:12.5px;" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Cartão / Conta de destino</label>
            <div class="field-box">
              <span class="field-prefix">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </span>
              <select id="imp-target-account" class="form-select"></select>
            </div>
          </div>
        </div>

        <div class="form-row-2" style="align-items:center;">
          <label class="pro-checkbox-row" style="margin:0;">
            <input type="checkbox" id="imp-project-installments" checked />
            <span>Projetar parcelas futuras automaticamente nos próximos meses (Parcela X/Y → Y/Y)</span>
          </label>

          <div class="form-group" id="imp-api-key-wrap">
            <label class="form-label">Chave Gemini API (opcional p/ CSV/MD · usada em PDF/Foto)</label>
            <div class="field-box" style="height:38px;">
              <span class="field-prefix">🔑</span>
              <input type="password" id="imp-gemini-key" class="form-input" placeholder="Cole sua GEMINI_API_KEY (salva no navegador)" style="font-size:12px;" />
            </div>
          </div>
        </div>

        <details class="quick-more-details" id="imp-md-paste-details">
          <summary>Ou colar conteúdo Markdown (.md) / texto da fatura diretamente</summary>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            <textarea id="imp-md-textarea" class="form-input" rows="4" placeholder="Ex:&#10;| Data | Descrição | Valor |&#10;| --- | --- | --- |&#10;| 12/11/2026 | Mercado Livre - Parcela 2/10 | R$ 149,90 |" style="resize:vertical; font-family:monospace; font-size:12px; padding:10px;"></textarea>
            <div style="display:flex; justify-content:flex-end;">
              <button type="button" class="btn-secondary" id="btn-imp-parse-md-text" style="padding:6px 14px; font-size:12px;">
                Analisar Markdown Colado
              </button>
            </div>
          </div>
        </details>

        <div id="imp-status-banner" style="display:none; padding:10px 14px; border-radius:10px; font-size:12.5px; font-weight:500;"></div>

        <!-- Barra de Resumo e Ações da Pré-visualização -->
        <div id="imp-preview-section" style="display:none; flex-direction:column; gap:12px;">
          <div class="tx-summary-strip" style="margin:0; justify-content:space-between; align-items:center;">
            <div id="imp-summary-metrics" style="display:flex; gap:16px; flex-wrap:wrap; font-size:12.5px;"></div>
            <button type="button" class="btn-secondary" id="btn-imp-ai-categorize" style="padding:6px 12px; font-size:11.5px; white-space:nowrap;">
              ✨ Sugerir Categorias c/ IA (Desconhecidos)
            </button>
          </div>

          <div class="table-responsive-wrap" style="max-height:340px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:12px;">
            <table class="data-table" id="imp-review-table" style="font-size:12px;">
              <thead>
                <tr>
                  <th style="width:32px;"><input type="checkbox" id="imp-check-all" checked /></th>
                  <th style="width:118px;">Data</th>
                  <th>Estabelecimento Limpo</th>
                  <th style="width:105px;">Parcela</th>
                  <th style="width:130px;">Classificação</th>
                  <th style="width:155px;">Categoria</th>
                  <th style="width:110px; text-align:right;">Valor (R$)</th>
                </tr>
              </thead>
              <tbody id="imp-review-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <span id="imp-footer-hint" style="font-size:11.5px; color:var(--text-muted);">CSV e Markdown (.md) são processados localmente sem custo de API.</span>
        <div class="modal-footer-right">
          <button type="button" class="btn-secondary" data-close-modal="modal-import-invoice">Cancelar</button>
          <button type="button" class="btn-primary" id="btn-confirm-import-invoice" disabled>Confirmar e Lançar Fatura</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast de Desfazer Edição em Lote -->
  <div id="undo-toast" role="status">
    <span id="undo-toast-msg">Alteração em lote aplicada.</span>
    <button type="button" class="btn-primary" id="btn-undo-batch" style="padding:5px 12px; font-size:12px;">Desfazer</button>
  </div>

  <div id="chart-tooltip" role="tooltip"></div>`;
