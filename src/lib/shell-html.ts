export const FAROL_SHELL_HTML = `<!-- ==================== TELA INICIAL DE LOGIN / CRIAR CONTA (AUTH GATE — ESTILO SKY & BENTO) ==================== -->
  <section class="auth-gate-screen" id="auth-gate-screen">
    <div class="auth-sky-canvas" aria-hidden="true">
      <div class="auth-sky-orb orb-1"></div>
      <div class="auth-sky-orb orb-2"></div>
      <div class="auth-sky-orb orb-3"></div>
      <div class="auth-sky-grid"></div>
    </div>

    <header class="auth-gate-topbar">
      <div class="auth-topbar-pill">
        <div class="auth-gate-brand-mini">
          <div class="brand-logo" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v2"/><path d="M12 8a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4Z"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 6.34 1.41-1.41"/>
            </svg>
          </div>
          <span>Farol Finanças</span>
        </div>

        <span class="auth-topbar-trust">Sincronização PostgreSQL · 2FA</span>

        <button type="button" class="auth-gate-hero-btn" id="gate-hero-toggle-btn">
          CRIAR CONTA
        </button>
      </div>
    </header>

    <div class="auth-gate-stage">
      <!-- Showcase Editorial + Cards Flutuantes sobre Céu Luminoso (Finexa / Flowpay / Apptics) -->
      <div class="auth-gate-hero-card">
        <div class="auth-gate-hero-content">
          <span class="auth-hero-pill">
            <span class="pulse-dot"></span>
            Controle financeiro em tempo real
          </span>

          <h1 class="auth-hero-display">
            Seu dinheiro em <em class="serif-em">fluxo contínuo</em>, com clareza real.
          </h1>

          <h3 class="auth-gate-hero-title" id="gate-hero-title">BEM-VINDO!</h3>
          <p class="auth-gate-hero-sub" id="gate-hero-sub">
            Organize contas, faturas, metas e projeções em um único painel sincronizado na nuvem.
          </p>

          <!-- Bento Preview Cards Flutuantes -->
          <div class="auth-float-cluster" aria-hidden="true">
            <div class="auth-float-card float-card-a">
              <div class="float-card-top">
                <span class="float-label">Fluxo do mês</span>
                <span class="float-badge-mint">Em dia</span>
              </div>
              <div class="float-val">Clareza total</div>
              <svg class="float-spark-svg" viewBox="0 0 180 38" width="100%" height="36">
                <defs>
                  <linearGradient id="authSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.28" />
                    <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 4 28 C 32 24, 52 30, 82 18 C 110 7, 140 16, 176 6 L 176 36 L 4 36 Z" fill="url(#authSparkFill)" />
                <path d="M 4 28 C 32 24, 52 30, 82 18 C 110 7, 140 16, 176 6" fill="none" stroke="#0d6efd" stroke-width="2.4" stroke-linecap="round" class="anim-spark-draw" />
                <circle cx="176" cy="6" r="3.5" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
              </svg>
            </div>

            <div class="auth-float-stack">
              <div class="auth-float-card float-card-b">
                <span class="float-label">Leitura de Faturas</span>
                <div class="float-chips-row">
                  <span>CSV</span>
                  <span>.MD</span>
                  <span>PDF</span>
                  <span>IA</span>
                </div>
              </div>

              <div class="auth-float-card float-card-c">
                <div class="float-card-top">
                  <span class="float-label">Metas & Reserva</span>
                  <span class="float-pct">2FA Ativo</span>
                </div>
                <div class="float-bar-track">
                  <div class="float-bar-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Porcelain / Glass de Login & Cadastro -->
      <div class="auth-gate-form-card" id="auth-gate-form-card">
        <div class="auth-card-mode-pills" role="tablist" aria-label="Modo de acesso">
          <button type="button" class="auth-mode-pill active" data-gate-mode-btn="login">Entrar</button>
          <button type="button" class="auth-mode-pill" data-gate-mode-btn="register">Criar conta</button>
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
    </div>
  </section>

  <div class="app-shell" id="main-app-shell" style="display:none;">
    <!-- ==================== SIDEBAR ==================== -->
    <aside class="sidebar">
      <div class="sidebar-top-group">
        <div class="brand">
          <div class="brand-logo" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
                <span>Visão geral</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="transacoes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10h8"/><path d="m13 7 3 3-3 3"/><path d="M16 15H8"/><path d="m11 12-3 3 3 3"/></svg>
                <span>Transações</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="recorrencias">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/><path d="M12 7v5l3 2"/></svg>
                <span>Recorrências</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="fluxo-caixa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c3-6 6-6 9 0s6 6 9-4"/><circle cx="21" cy="13" r="2"/></svg>
                <span>Fluxo de caixa</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="faturas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h3"/><path d="M13 15h2"/></svg>
                <span>Faturas</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="categorias">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                <span>Categorias</span>
              </button>
            </li>
          </ul>

          <div class="nav-section-label" style="margin-top: 10px;">VISÃO ESTRATÉGICA</div>
          <ul class="nav-list" id="nav-estrategica">
            <li>
              <button class="nav-item" data-tab="metas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m12 12 6-6"/><path d="M15 6h3v3"/></svg>
                <span>Metas</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="patrimonio">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9l4-6Z"/><path d="M2 9h20"/><path d="m12 21 4-12-4-6-4 6 4 12Z"/></svg>
                <span>Patrimônio</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="projecao">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-6"/><circle cx="20" cy="7" r="1.5"/></svg>
                <span>Projeção</span>
              </button>
            </li>
            <li>
              <button class="nav-item" data-tab="contas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M7 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="16" cy="13" r="1.5"/></svg>
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

          <!-- Atalho Painel Admin (Exibido apenas para administrador autorizado) -->
          <a href="/admin" id="admin-panel-link" class="month-pill admin-entry-pill" title="Abrir Painel Admin (Métricas & Cliques)" style="display:none; text-decoration:none; align-items:center; gap:6px; font-weight:700;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Admin</span>
          </a>

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
  <dialog class="modal-dialog" id="modal-transaction" closedby="any" aria-labelledby="modal-tx-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-tx-title">Lançamento rápido</h2>
            <p class="modal-subtitle">Registre entradas, saídas à vista ou parceladas no cartão</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-transaction" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-transaction">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Prévia do lançamento">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">PRÉVIA DO LANÇAMENTO</span>
              <div class="modal-rail-badge is-danger" id="tx-rail-type-pill">Saída</div>
              <div class="modal-rail-amount sensitive-val" id="tx-rail-amount">R$ 0,00</div>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Categoria</span>
                  <strong id="tx-rail-cat">Geral</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Origem</span>
                  <strong id="tx-rail-acc">Conta Principal</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Condição</span>
                  <strong id="tx-rail-parcel">À vista</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Classificação automática por palavras-chave na descrição ao criar um lançamento.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="tx-id" />
            <input type="hidden" id="tx-category" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>VALOR & NATUREZA</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="tx-amount">Valor da transação</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0.01" id="tx-amount" name="amount" class="form-input" placeholder="0,00" aria-describedby="tx-amount-hint" required />
                  </div>
                  <span class="field-hint" id="tx-amount-hint">Informe o valor total da operação.</span>
                </div>
                <div class="form-group">
                  <span class="form-label" id="tx-type-group-label">Tipo</span>
                  <select id="tx-type" class="visually-hidden" tabindex="-1" aria-hidden="true">
                    <option value="expense">Saída</option>
                    <option value="income">Entrada</option>
                  </select>
                  <div class="pro-seg-group" data-seg-for="tx-type" role="group" aria-labelledby="tx-type-group-label">
                    <button type="button" class="pro-seg-btn active" data-seg-val="expense" aria-pressed="true">
                      <span class="seg-dot red" aria-hidden="true"></span>Saída
                    </button>
                    <button type="button" class="pro-seg-btn" data-seg-val="income" aria-pressed="false">
                      <span class="seg-dot green" aria-hidden="true"></span>Entrada
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>CATEGORIA</span>
              </div>
              <div class="form-group">
                <span class="form-label" id="tx-cats-label">Mais usadas primeiro</span>
                <div id="quick-cat-chips" class="quick-cat-chips" role="group" aria-labelledby="tx-cats-label"></div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>DETALHES DA CONTA</span>
              </div>
              <details class="quick-more-details" id="quick-more-details" open>
                <summary>Descrição, conta, data e parcelamento</summary>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="tx-desc">Descrição</label>
                    <div class="field-box">
                      <span class="field-prefix" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="17" x2="12" y2="17"/></svg>
                      </span>
                      <input type="text" id="tx-desc" name="description" class="form-input" placeholder="Ex: iFood / Mercado" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="tx-tag">Tag (opcional)</label>
                    <div class="field-box">
                      <span class="field-prefix" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      </span>
                      <input type="text" id="tx-tag" name="tag" class="form-input" placeholder="Ex: trabalho, viagem" />
                    </div>
                  </div>
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="tx-account">Conta / Cartão</label>
                    <div class="field-box">
                      <span class="field-prefix" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      </span>
                      <select id="tx-account" name="account" class="form-select" required></select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="tx-date">Data</label>
                    <div class="field-box">
                      <span class="field-prefix" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                      </span>
                      <input type="date" id="tx-date" name="date" class="form-input" required />
                    </div>
                  </div>
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label" for="tx-method">Método de pagamento</label>
                    <div class="field-box">
                      <span class="field-prefix" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/></svg>
                      </span>
                      <select id="tx-method" name="method" class="form-select">
                        <option value="Conta Corrente / Pix">Pix / Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group" id="tx-installments-wrap" style="display:none;">
                    <label class="form-label" for="tx-installments">Parcelas</label>
                    <div class="field-box">
                      <select id="tx-installments" name="installments" class="form-select">
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
                      <span id="tx-installment-preview" class="field-suffix" style="color:var(--azure-primary);"></span>
                    </div>
                  </div>
                </div>
                <label class="pro-checkbox-row" id="tx-recurring-wrap" for="tx-is-recurring">
                  <input type="checkbox" id="tx-is-recurring" name="isRecurring" />
                  <span id="tx-recurring-label">Repetir mensalmente (salvar em Recorrências)</span>
                </label>
              </details>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-transaction" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-transaction">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: PERFIL & ORÇAMENTO ==================== -->
  <dialog class="modal-dialog" id="modal-profile" closedby="any" aria-labelledby="modal-profile-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-profile-title">Configurações & orçamento</h2>
            <p class="modal-subtitle">Perfis isolados, salário mensal fixo e metas financeiras</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-profile" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-profile">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Perfil selecionado e gestão de perfis">
            <div class="modal-rail-profile">
              <div class="modal-rail-avatar" id="prof-rail-avatar" aria-hidden="true">MN</div>
              <div class="modal-rail-fullname" id="prof-rail-name">Meu nome</div>
              <span class="modal-rail-amber-pill" id="prof-rail-plan">Plano pessoal</span>
            </div>

            <div class="modal-rail-group">
              <label class="modal-rail-eyebrow" for="prof-user-select">PERFIL ATIVO</label>
              <div class="field-box rail-input">
                <select id="prof-user-select" name="activeUser" class="form-select"></select>
              </div>
            </div>

            <div class="modal-rail-group">
              <label class="modal-rail-eyebrow" for="prof-new-user">NOVO PERFIL</label>
              <div class="field-box rail-input">
                <input type="text" id="prof-new-user" name="newUser" class="form-input" placeholder="Ex: Maria" />
              </div>
              <button type="button" class="btn-rail-outline" id="btn-create-user">+ Criar perfil</button>
            </div>

            <p class="modal-rail-note">
              Cada perfil guarda os próprios dados, isolados dos demais.
            </p>
          </aside>

          <div class="modal-pane">
            <div id="prof-import-local-wrap" class="modal-inline-banner" style="display:none;">
              <div>
                <strong>Dados locais anteriores encontrados neste navegador</strong>
                <span>Você pode puxar os lançamentos e metas salvos antes do login para esta conta.</span>
              </div>
              <button type="button" class="btn-secondary" id="btn-import-local-default">Importar dados locais</button>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>IDENTIDADE</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="prof-name">Seu nome</label>
                  <div class="field-box">
                    <input type="text" id="prof-name" name="profileName" class="form-input" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="prof-plan">Plano / subtítulo</label>
                  <div class="field-box">
                    <input type="text" id="prof-plan" name="profilePlan" class="form-input" required />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>RENDA</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="prof-salary">Salário mensal fixo</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="prof-salary" name="salary" class="form-input" placeholder="0,00" aria-describedby="prof-salary-hint" />
                  </div>
                  <span class="field-hint" id="prof-salary-hint">Deixe zero se sua renda varia.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="prof-salary-day">Dia do recebimento</label>
                  <div class="field-box">
                    <input type="number" min="1" max="31" id="prof-salary-day" name="salaryDay" class="form-input" value="5" aria-describedby="prof-day-hint" />
                    <span class="field-suffix" aria-hidden="true">de 1 a 31</span>
                  </div>
                  <span class="field-hint" id="prof-day-hint">Todo mês, no dia 5.</span>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>METAS</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="prof-budget">Orçamento mensal</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="prof-budget" name="monthlyBudget" class="form-input" aria-describedby="prof-budget-hint" required />
                  </div>
                  <span class="field-hint" id="prof-budget-hint">Sem teto mensal definido.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="prof-reserve-goal">Meta de reserva de emergência</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="prof-reserve-goal" name="reserveGoal" class="form-input" aria-describedby="prof-reserve-hint" required />
                  </div>
                  <span class="field-hint" id="prof-reserve-hint">Valor-alvo da sua reserva.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-reset-demo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Restaurar modelo
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-profile">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: EDITAR FATURA / CARTÃO ==================== -->
  <dialog class="modal-dialog" id="modal-invoice" closedby="any" aria-labelledby="modal-inv-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-inv-title">Editar fatura</h2>
            <p class="modal-subtitle">Gerencie limite, datas de fechamento/vencimento e status do ciclo</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-invoice" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-invoice">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Resumo da fatura">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">CARTÃO SELECIONADO</span>
              <div class="modal-rail-fullname left" id="inv-rail-name">Cartão de crédito</div>
              <div class="modal-rail-badge" id="inv-rail-status">Aberta</div>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Ciclo</span>
                  <strong id="inv-live-cycle">Fecha dia 5 · Vence dia 12</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Limite total</span>
                  <strong class="sensitive-val" id="inv-live-limit">R$ 0,00</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Lançamentos feitos após o fechamento entram automaticamente na fatura seguinte.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="inv-account-id" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>IDENTIFICAÇÃO & STATUS</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="inv-name">Nome do cartão / conta</label>
                <div class="field-box">
                  <span class="field-prefix" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </span>
                  <input type="text" id="inv-name" name="cardName" class="form-input" placeholder="Ex: Nubank, Mercado Pago" required />
                </div>
              </div>

              <div class="form-group">
                <span class="form-label" id="inv-status-group-label">Status da fatura</span>
                <select id="inv-status" class="visually-hidden" tabindex="-1" aria-hidden="true">
                  <option value="open">Aberta</option>
                  <option value="closed">Fechada</option>
                  <option value="paid">Paga</option>
                </select>
                <div class="pro-seg-group cols-3" data-seg-for="inv-status" role="group" aria-labelledby="inv-status-group-label">
                  <button type="button" class="pro-seg-btn active" data-seg-val="open" aria-pressed="true">
                    <span class="seg-dot cyan" aria-hidden="true"></span>Aberta
                  </button>
                  <button type="button" class="pro-seg-btn" data-seg-val="closed" aria-pressed="false">
                    <span class="seg-dot amber" aria-hidden="true"></span>Fechada
                  </button>
                  <button type="button" class="pro-seg-btn" data-seg-val="paid" aria-pressed="false">
                    <span class="seg-dot green" aria-hidden="true"></span>Paga
                  </button>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>LIMITE & AJUSTE</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="inv-limit">Limite total</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="1" id="inv-limit" name="limit" class="form-input" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="inv-manual-adj">Ajuste / valor avulso</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" id="inv-manual-adj" name="adjustment" class="form-input" placeholder="0,00" aria-describedby="inv-adj-hint" />
                  </div>
                  <span class="field-hint" id="inv-adj-hint">Créditos, IOF ou correções da fatura.</span>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>CICLO MENSAL</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="inv-closing-day">Dia de fechamento</label>
                  <div class="field-box">
                    <input type="number" min="1" max="31" id="inv-closing-day" name="closingDay" class="form-input" aria-describedby="inv-closing-hint" required />
                    <span class="field-suffix" aria-hidden="true">de 1 a 31</span>
                  </div>
                  <span class="field-hint" id="inv-closing-hint">Todo mês, no dia 5.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="inv-due-day">Dia de vencimento</label>
                  <div class="field-box">
                    <input type="number" min="1" max="31" id="inv-due-day" name="dueDay" class="form-input" aria-describedby="inv-due-hint" required />
                    <span class="field-suffix" aria-hidden="true">de 1 a 31</span>
                  </div>
                  <span class="field-hint" id="inv-due-hint">Todo mês, no dia 12.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-invoice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-invoice">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: ATIVO / PATRIMÔNIO ==================== -->
  <dialog class="modal-dialog" id="modal-asset" closedby="any" aria-labelledby="modal-asset-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-asset-title">Editar ativo</h2>
            <p class="modal-subtitle">Configure saldo, rentabilidade % do CDI e faixas com limite promocional</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-asset" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-asset">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Projeção de rendimento do ativo">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">PROJEÇÃO DO ATIVO</span>
              <div class="modal-rail-fullname left" id="ast-rail-name">Novo ativo</div>
              <span class="modal-rail-amber-pill" id="ast-rail-class">Renda Fixa (CDB)</span>
              <div class="modal-rail-amount sensitive-val" id="ast-rail-balance">R$ 0,00</div>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Rend. mensal</span>
                  <strong class="sensitive-val" id="ast-live-monthly">+R$ 0,00</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Projeção anual</span>
                  <strong class="sensitive-val" id="ast-live-annual">+R$ 0,00</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Taxa / Liquidez</span>
                  <strong id="ast-rail-rate">100% CDI · Diária</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Estimativa líquida calculada automaticamente com base na taxa CDI e alíquota configuradas.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="ast-id" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>IDENTIFICAÇÃO DO ATIVO</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="ast-name">Nome do ativo</label>
                  <div class="field-box">
                    <input type="text" id="ast-name" name="assetName" class="form-input" placeholder="Ex: CDB Liquidez Diária" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="ast-category">Classe</label>
                  <div class="field-box">
                    <select id="ast-category" name="assetCategory" class="form-select">
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
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>SALDO & CUSTÓDIA</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="ast-amount">Saldo atual</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="ast-amount" name="assetAmount" class="form-input" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="ast-cdb-pct">Rentabilidade principal</label>
                  <div class="field-box">
                    <input type="number" step="0.5" min="0" max="500" id="ast-cdb-pct" name="cdbPercent" class="form-input" placeholder="100" required />
                    <span class="field-suffix" aria-hidden="true">% CDI</span>
                  </div>
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="ast-institution">Instituição</label>
                  <div class="field-box">
                    <input type="text" id="ast-institution" name="institution" class="form-input" placeholder="Ex: Mercado Pago, Nubank" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="ast-liquidity">Liquidez</label>
                  <div class="field-box">
                    <select id="ast-liquidity" name="liquidity" class="form-select">
                      <option value="Diária">Liquidez Diária</option>
                      <option value="D+1">D+1</option>
                      <option value="D+30">D+30</option>
                      <option value="No Vencimento">No Vencimento</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>FAIXA PROMOCIONAL (OPCIONAL)</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="ast-promo-cap">Teto da taxa principal</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="ast-promo-cap" name="promoCap" class="form-input" placeholder="0,00 (sem teto)" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="ast-excess-pct">Taxa acima do teto</label>
                  <div class="field-box">
                    <input type="number" step="0.5" min="0" max="500" id="ast-excess-pct" name="excessPercent" class="form-input" placeholder="100" />
                    <span class="field-suffix" aria-hidden="true">% CDI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-asset">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-asset">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: CATEGORIA & REGRAS AUTOMÁTICAS ==================== -->
  <dialog class="modal-dialog" id="modal-category" closedby="any" aria-labelledby="modal-cat-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-cat-title">Nova categoria</h2>
            <p class="modal-subtitle">Defina o teto de gastos mensal e palavras-chave de identificação automática</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-category" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-category">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Prévia da categoria">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">ETIQUETA DA CATEGORIA</span>
              <div class="modal-rail-cat-preview">
                <span class="cat-dot" id="cat-rail-dot" style="background:#38b6ff;"></span>
                <strong id="cat-rail-name">Nova categoria</strong>
              </div>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Teto mensal</span>
                  <strong class="sensitive-val" id="cat-rail-budget">R$ 200,00</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Regras</span>
                  <strong id="cat-rail-rules">0 termos</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Faturas e lançamentos manuais usam essas palavras-chave para categorizar automaticamente.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="cat-id" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>IDENTIDADE</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="cat-name">Nome da categoria</label>
                  <div class="field-box">
                    <input type="text" id="cat-name" name="categoryName" class="form-input" placeholder="Ex: Delivery" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="cat-color">Cor de identificação</label>
                  <div class="field-box color-picker-box">
                    <input type="color" id="cat-color" name="categoryColor" class="form-color-input" value="#38b6ff" />
                    <span class="field-suffix" id="cat-color-hex">#38B6FF</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>ORÇAMENTO & AUTOMAÇÃO</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="cat-budget">Orçamento mensal</label>
                <div class="field-box">
                  <span class="field-prefix" aria-hidden="true">R$</span>
                  <input type="number" step="0.01" min="0" id="cat-budget" name="categoryBudget" class="form-input" placeholder="150,00" aria-describedby="cat-budget-hint" required />
                </div>
                <span class="field-hint" id="cat-budget-hint">Cerca de R$ 6,67 por dia.</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="cat-rules">Regras automáticas</label>
                <div class="field-box">
                  <span class="field-prefix" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input type="text" id="cat-rules" name="categoryRules" class="form-input" placeholder="Ex: ifood, rappi, lanche, pizza" aria-describedby="cat-rules-hint" />
                </div>
                <span class="field-hint" id="cat-rules-hint">Separe palavras-chave por vírgula.</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-archive-category">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            Arquivar
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-category">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: NOVA / EDITAR RECORRÊNCIA ==================== -->
  <dialog class="modal-dialog" id="modal-recurrence" closedby="any" aria-labelledby="modal-rec-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-rec-title">Editar recorrência</h2>
            <p class="modal-subtitle">Assinaturas e contas fixas lançadas todo mês</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-recurrence" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-recurrence">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Resumo da recorrência">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">PREVISÃO MENSAL</span>
              <div class="modal-rail-badge is-danger" id="rec-rail-type">Saída fixa</div>
              <div class="modal-rail-fullname left" id="rec-rail-name">Nova assinatura</div>
              <div class="modal-rail-amount sensitive-val" id="rec-rail-amount">R$ 0,00</div>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Próxima cobrança</span>
                  <strong id="rec-live-next">10 de dez de 2026</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Impacto anual</span>
                  <strong class="sensitive-val" id="rec-live-annual">R$ 0,00</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Lançada automaticamente no mês ativo sem precisar digitar todo mês.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="rec-id" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>DETALHES DA ASSINATURA</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="rec-desc">Nome</label>
                <div class="field-box">
                  <input type="text" id="rec-desc" name="recurrenceName" class="form-input" placeholder="Ex: Academia, Aluguel, Internet" required />
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="rec-amount">Valor mensal</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0.01" id="rec-amount" name="recurrenceAmount" class="form-input" placeholder="45,00" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="rec-day">Dia do vencimento</label>
                  <div class="field-box">
                    <input type="number" min="1" max="31" id="rec-day" name="recurrenceDay" class="form-input" value="10" aria-describedby="rec-day-hint" required />
                    <span class="field-suffix" aria-hidden="true">de 1 a 31</span>
                  </div>
                  <span class="field-hint" id="rec-day-hint">Todo mês, no dia 10.</span>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>CLASSIFICAÇÃO</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <span class="form-label" id="rec-type-group-label">Tipo</span>
                  <select id="rec-type" class="visually-hidden" tabindex="-1" aria-hidden="true">
                    <option value="expense">Saída</option>
                    <option value="income">Entrada</option>
                  </select>
                  <div class="pro-seg-group" data-seg-for="rec-type" role="group" aria-labelledby="rec-type-group-label">
                    <button type="button" class="pro-seg-btn active" data-seg-val="expense" aria-pressed="true">
                      <span class="seg-dot red" aria-hidden="true"></span>Saída
                    </button>
                    <button type="button" class="pro-seg-btn" data-seg-val="income" aria-pressed="false">
                      <span class="seg-dot green" aria-hidden="true"></span>Entrada
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="rec-category">Categoria</label>
                  <div class="field-box">
                    <select id="rec-category" name="recurrenceCategory" class="form-select"></select>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="rec-account">Conta / Cartão</label>
                <div class="field-box">
                  <select id="rec-account" name="recurrenceAccount" class="form-select"></select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-recurrence" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-recurrence">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: NOVA CONTA / CARTÃO ==================== -->
  <dialog class="modal-dialog" id="modal-account" closedby="any" aria-labelledby="modal-acc-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-acc-title">Nova conta ou cartão</h2>
            <p class="modal-subtitle">Configure contas correntes, cartões de crédito ou bancos híbridos</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-account" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-account">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Resumo da conta ou cartão">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">PRÉVIA DA CONTA</span>
              <div class="modal-rail-fullname left" id="acc-rail-name">Nova instituição</div>
              <span class="modal-rail-amber-pill" id="acc-rail-type">Conta + Cartão</span>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Saldo inicial</span>
                  <strong class="sensitive-val" id="acc-rail-balance">R$ 0,00</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Limite crédito</span>
                  <strong class="sensitive-val" id="acc-rail-limit">R$ 3.000,00</strong>
                </div>
                <div class="modal-rail-meta-row" id="acc-rail-cycle-row">
                  <span>Ciclo</span>
                  <strong id="acc-rail-cycle">Fecha 5 · Vence 12</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Contas híbridas controlam saldo à vista e fatura de crédito no mesmo lugar.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="acc-id" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>INSTITUIÇÃO & MODALIDADE</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="acc-name">Nome do banco ou cartão</label>
                  <div class="field-box">
                    <input type="text" id="acc-name" name="accountName" class="form-input" placeholder="Ex: Nubank, Mercado Pago" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="acc-type">Modalidade</label>
                  <div class="field-box">
                    <select id="acc-type" name="accountType" class="form-select">
                      <option value="Conta + Cartão">Conta + Cartão</option>
                      <option value="Conta Corrente">Conta Corrente</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>SALDO & LIMITE</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="acc-balance">Saldo inicial</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" id="acc-balance" name="accountBalance" class="form-input" value="0.00" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="acc-limit">Limite disponível</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="acc-limit" name="accountLimit" class="form-input" value="3000.00" />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section" id="acc-card-dates-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>VENCIMENTO DO CARTÃO</span>
              </div>
              <div class="form-row-2" id="acc-card-dates-row">
                <div class="form-group">
                  <label class="form-label" for="acc-closing-day">Dia de fechamento</label>
                  <div class="field-box">
                    <input type="number" min="1" max="31" id="acc-closing-day" name="closingDay" class="form-input" value="5" aria-describedby="acc-closing-hint" />
                    <span class="field-suffix" aria-hidden="true">de 1 a 31</span>
                  </div>
                  <span class="field-hint" id="acc-closing-hint">Todo mês, no dia 5.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="acc-due-day">Dia de vencimento</label>
                  <div class="field-box">
                    <input type="number" min="1" max="31" id="acc-due-day" name="dueDay" class="form-input" value="12" aria-describedby="acc-due-hint" />
                    <span class="field-suffix" aria-hidden="true">de 1 a 31</span>
                  </div>
                  <span class="field-hint" id="acc-due-hint">Todo mês, no dia 12.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-account">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-account">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar alterações</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: NOVA / EDITAR META ==================== -->
  <dialog class="modal-dialog" id="modal-goal" closedby="any" aria-labelledby="modal-goal-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-goal-title">Nova meta</h2>
            <p class="modal-subtitle">Defina objetivo, valor acumulado e prazo previsto</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-goal" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-goal">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Progresso da meta">
            <div class="modal-rail-card center">
              <div class="modal-rail-ring" id="goal-rail-ring" style="--goal-pct: 0%; --goal-accent: #0d6efd;">
                <span class="modal-rail-ring-val" id="goal-rail-pct">0%</span>
              </div>
              <div class="modal-rail-fullname" id="goal-rail-name">Nova meta</div>
              <div class="modal-rail-meta-list">
                <div class="modal-rail-meta-row">
                  <span>Progresso</span>
                  <strong class="sensitive-val" id="goal-rail-progress">R$ 0,00</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Faltam</span>
                  <strong class="sensitive-val" id="goal-rail-remaining">R$ 0,00</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Prazo</span>
                  <strong id="goal-rail-deadline">Sem prazo</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note">
              Registre aportes extras direto na aba Metas ou ajuste os valores aqui.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="goal-id" />

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>OBJETIVO</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="goal-title">Nome da meta</label>
                  <div class="field-box">
                    <input type="text" id="goal-title" name="goalTitle" class="form-input" placeholder="Ex: Reserva de Emergência" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="goal-color">Cor de destaque</label>
                  <div class="field-box color-picker-box">
                    <input type="color" id="goal-color" name="goalColor" class="form-color-input" value="#38b6ff" />
                    <span class="field-suffix" id="goal-color-hex">#38B6FF</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <div class="modal-section-eyebrow">
                <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                <span>VALORES & PRAZO</span>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="goal-current">Valor atual acumulado</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0" id="goal-current" name="goalCurrent" class="form-input" placeholder="0,00" required />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="goal-target">Valor alvo da meta</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">R$</span>
                    <input type="number" step="0.01" min="0.01" id="goal-target" name="goalTarget" class="form-input" placeholder="1000,00" aria-describedby="goal-target-hint" required />
                  </div>
                  <span class="field-hint" id="goal-target-hint">Quanto deseja acumular no total.</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="goal-deadline">Prazo previsto</label>
                <div class="field-box">
                  <span class="field-prefix" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  </span>
                  <input type="month" id="goal-deadline" name="goalDeadline" class="form-input" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-modal-delete" id="btn-delete-goal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Excluir
          </button>
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" data-close-modal="modal-goal">Cancelar</button>
            <button type="submit" class="btn-primary" id="btn-goal-submit">Salvar meta</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: DIÁLOGO ESTILIZADO (CONFIRMAÇÃO / INPUT) ==================== -->
  <dialog class="modal-dialog modal-compact" id="modal-dialog" closedby="any" aria-labelledby="dialog-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="dialog-title">Confirmar ação</h2>
            <p class="modal-subtitle">Verifique os dados antes de prosseguir</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" id="dialog-close-x" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-dialog">
        <div class="modal-body modal-pane">
          <div class="modal-callout-box">
            <p id="dialog-message"></p>
          </div>
          <div class="modal-section" id="dialog-input-wrap" style="display:none; margin-top:14px;">
            <div class="modal-section-eyebrow">
              <span class="modal-eyebrow-dot" aria-hidden="true"></span>
              <span>ENTRADA SOLICITADA</span>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" id="dialog-input-label" for="dialog-input">Valor</label>
              <div class="field-box">
                <span class="field-prefix" id="dialog-input-prefix" aria-hidden="true">R$</span>
                <input type="text" id="dialog-input" name="dialogValue" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-section" id="dialog-select-wrap" style="display:none; margin-top:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" id="dialog-select-label" for="dialog-select">Conta</label>
              <div class="field-box">
                <select id="dialog-select" name="dialogSelect" class="form-select"></select>
              </div>
            </div>
          </div>
          <p id="dialog-error" role="alert" style="display:none; margin:10px 0 0; font-size:12.5px; font-weight:600; color:var(--coral-red);"></p>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-right">
            <button type="button" class="btn-secondary" id="dialog-cancel-btn">Cancelar</button>
            <button type="submit" class="btn-primary" id="dialog-confirm-btn">Confirmar</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>

  <!-- ==================== MODAL: CONTA NA NUVEM (LOGIN / CADASTRO POSTGRESQL) ==================== -->
  <dialog class="modal-dialog" id="modal-auth" closedby="any" aria-labelledby="modal-auth-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-auth-title">Conta na Nuvem</h2>
            <p class="modal-subtitle">Salve suas contas bancárias, cartões e lançamentos no banco PostgreSQL</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-auth" aria-label="Fechar janela">✕</button>
      </div>
      <form id="form-auth">
        <div class="modal-split-body">
          <aside class="modal-rail" aria-label="Status da sincronização em nuvem">
            <div class="modal-rail-card">
              <span class="modal-rail-eyebrow">SINCRONIZAÇÃO NUVEM</span>
              <span class="modal-rail-amber-pill" id="auth-rail-badge">PostgreSQL + 2FA</span>
              <div class="modal-rail-meta-list" style="margin-top:6px;">
                <div class="modal-rail-meta-row">
                  <span>Segurança</span>
                  <strong>Código OTP</strong>
                </div>
                <div class="modal-rail-meta-row">
                  <span>Isolamento</span>
                  <strong>Por usuário</strong>
                </div>
              </div>
            </div>
            <p class="modal-rail-note" id="auth-rail-desc">
              Mantenha seus dados financeiros sincronizados entre navegador, celular e desktop.
            </p>
          </aside>

          <div class="modal-pane">
            <input type="hidden" id="auth-mode" value="login" />

            <div id="auth-logged-view" style="display:none;">
              <div class="modal-section">
                <div class="modal-section-eyebrow">
                  <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                  <span>SESSÃO ATIVA</span>
                </div>
                <div class="modal-live-summary" style="grid-template-columns:1fr;">
                  <div class="modal-live-cell">
                    <div class="modal-live-label">CONECTADO NA NUVEM (POSTGRESQL)</div>
                    <div class="modal-live-val" id="auth-logged-email">usuario@email.com</div>
                    <div style="font-size:12px; color:var(--green-emerald); margin-top:4px; font-weight:600;">Sincronização automática ativa em todos os dispositivos</div>
                  </div>
                </div>
              </div>
            </div>

            <div id="auth-form-fields">
              <div class="modal-section">
                <div class="modal-section-eyebrow">
                  <span class="modal-eyebrow-dot" aria-hidden="true"></span>
                  <span>ACESSO À CONTA</span>
                </div>
                <div class="form-group">
                  <span class="form-label" id="auth-seg-label">Modo de acesso</span>
                  <div class="pro-seg-group" id="auth-seg-group" role="group" aria-labelledby="auth-seg-label">
                    <button type="button" class="pro-seg-btn active" data-auth-tab="login" aria-pressed="true">
                      <span class="seg-dot cyan" aria-hidden="true"></span>Entrar
                    </button>
                    <button type="button" class="pro-seg-btn" data-auth-tab="register" aria-pressed="false">
                      <span class="seg-dot green" aria-hidden="true"></span>Criar Conta
                    </button>
                  </div>
                </div>

                <div class="form-group" id="auth-name-group" style="display:none;">
                  <label class="form-label" for="auth-name">Seu nome</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    <input type="text" id="auth-name" name="name" class="form-input" placeholder="Ex: Arthur" autocomplete="name" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="auth-email">E-mail</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">@</span>
                    <input type="email" id="auth-email" name="email" class="form-input" placeholder="seu@email.com" autocomplete="username" spellcheck="false" autocapitalize="none" autocorrect="off" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="auth-password">Senha</label>
                  <div class="field-box">
                    <span class="field-prefix" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input type="password" id="auth-password" name="password" class="form-input" placeholder="Mínimo 4 caracteres" autocomplete="current-password" minlength="4" required />
                  </div>
                </div>
              </div>
            </div>

            <div id="auth-feedback" role="status" aria-live="polite" style="display:none; font-size:12.5px; padding:10px 12px; border-radius:10px; margin-top:6px;"></div>
          </div>
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
  </dialog>

  <!-- ==================== MODAL: UPLOAD E REVISÃO INTELIGENTE DE FATURA (CSV / PDF / IMAGEM) ==================== -->
  <dialog class="modal-dialog modal-wide" id="modal-import-invoice" closedby="any" aria-labelledby="modal-imp-title">
    <div class="modal-card-shell">
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-icon-badge" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
          </div>
          <div class="modal-header-text">
            <h2 class="modal-title" id="modal-imp-title">Importar Fatura ou Extrato (CSV, MD, PDF ou Imagem)</h2>
            <p class="modal-subtitle">Leitura completa de Markdown (.md), CSV, PDF e imagens com extração de parcelas (X/Y), estornos e revisão editável</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" data-close-modal="modal-import-invoice" aria-label="Fechar janela">✕</button>
      </div>

      <div class="modal-split-body modal-import-split">
        <aside class="modal-rail" aria-label="Configuração da importação">
          <div class="modal-section-eyebrow">
            <span class="modal-eyebrow-dot" aria-hidden="true"></span>
            <span>ARQUIVO & DESTINO</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="imp-file-input">Arquivo da fatura</label>
            <div class="field-box rail-input file-box">
              <input type="file" id="imp-file-input" name="invoiceFile" accept=".csv,.md,.markdown,.pdf,.png,.jpg,.jpeg,.webp,.ofx,.txt" class="form-input" style="font-size:12px;" />
            </div>
            <span class="field-hint">.csv, .md, .pdf, .png, .jpg ou .ofx</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="imp-target-account">Cartão / Conta de destino</label>
            <div class="field-box rail-input">
              <select id="imp-target-account" name="targetAccount" class="form-select"></select>
            </div>
          </div>

          <label class="pro-checkbox-row" for="imp-project-installments">
            <input type="checkbox" id="imp-project-installments" name="projectInstallments" checked />
            <span>Projetar parcelas futuras (X/Y → Y/Y)</span>
          </label>

          <div class="form-group" id="imp-api-key-wrap" style="margin-top:4px; margin-bottom:0;">
            <label class="form-label" for="imp-gemini-key">Chave Gemini API (PDF/Foto)</label>
            <div class="field-box rail-input" style="height:40px;">
              <span class="field-prefix" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
              </span>
              <input type="password" id="imp-gemini-key" name="geminiKey" class="form-input" placeholder="Opcional p/ CSV/MD" style="font-size:12px;" />
            </div>
          </div>
        </aside>

        <div class="modal-pane" style="gap:14px;">
          <div class="modal-section" style="margin-bottom:0;">
            <div class="modal-section-eyebrow">
              <span class="modal-eyebrow-dot" aria-hidden="true"></span>
              <span>ENTRADA RÁPIDA OU REVISÃO</span>
            </div>

            <details class="quick-more-details" id="imp-md-paste-details">
              <summary>Ou colar conteúdo Markdown (.md) / texto da fatura diretamente</summary>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                <label class="visually-hidden" for="imp-md-textarea">Texto ou tabela Markdown da fatura</label>
                <textarea id="imp-md-textarea" name="markdownText" class="form-input" rows="4" placeholder="Ex:&#10;| Data | Descrição | Valor |&#10;| --- | --- | --- |&#10;| 12/11/2026 | Mercado Livre - Parcela 2/10 | R$ 149,90 |" style="resize:vertical; font-family:monospace; font-size:12px; padding:10px;"></textarea>
                <div style="display:flex; justify-content:flex-end;">
                  <button type="button" class="btn-secondary" id="btn-imp-parse-md-text" style="padding:7px 14px; font-size:12px;">
                    Analisar Markdown Colado
                  </button>
                </div>
              </div>
            </details>

            <div id="imp-status-banner" role="status" aria-live="polite" style="display:none; padding:10px 14px; border-radius:10px; font-size:12.5px; font-weight:500;"></div>

            <div id="imp-preview-section" style="display:none; flex-direction:column; gap:12px; margin-top:10px;">
              <div class="tx-summary-strip" style="margin:0; justify-content:space-between; align-items:center;">
                <div id="imp-summary-metrics" style="display:flex; gap:16px; flex-wrap:wrap; font-size:12.5px;"></div>
                <button type="button" class="btn-secondary" id="btn-imp-ai-categorize" style="padding:6px 12px; font-size:11.5px; white-space:nowrap;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  Sugerir Categorias c/ IA (Desconhecidos)
                </button>
              </div>

              <div class="table-responsive-wrap" style="max-height:340px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:12px;">
                <table class="data-table" id="imp-review-table" style="font-size:12px;">
                  <thead>
                    <tr>
                      <th style="width:30px;"><input type="checkbox" id="imp-check-all" aria-label="Selecionar todas as linhas" checked /></th>
                      <th style="width:94px;">Data</th>
                      <th>Estabelecimento Limpo</th>
                      <th style="width:74px;">Parcela</th>
                      <th style="width:102px;">Classificação</th>
                      <th style="width:130px;">Categoria</th>
                      <th style="width:94px; text-align:right;">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody id="imp-review-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <span id="imp-footer-hint" style="font-size:12px; color:var(--text-secondary);">CSV e Markdown (.md) são processados localmente sem custo de API.</span>
        <div class="modal-footer-right">
          <button type="button" class="btn-secondary" data-close-modal="modal-import-invoice">Cancelar</button>
          <button type="button" class="btn-primary" id="btn-confirm-import-invoice" disabled>Confirmar e Lançar Fatura</button>
        </div>
      </div>
    </div>
  </dialog>

  <!-- Toast de Desfazer Edição em Lote -->
  <div id="undo-toast" role="status">
    <span id="undo-toast-msg">Alteração em lote aplicada.</span>
    <button type="button" class="btn-primary" id="btn-undo-batch" style="padding:5px 12px; font-size:12px;">Desfazer</button>
  </div>

  <!-- ==================== PRODUCT TOUR / WALKTHROUGH PASSO A PASSO ==================== -->
  <div class="tour-backdrop-layer is-hidden" id="tour-backdrop-layer" aria-hidden="true">
    <div class="tour-spotlight-box" id="tour-spotlight-box"></div>
  </div>

  <dialog id="farol-tour-popover" popover="manual" role="dialog" aria-labelledby="tour-step-title" aria-describedby="tour-step-desc">
    <div class="tour-card-inner">
      <div class="tour-arrow" id="tour-arrow" data-dir="top" aria-hidden="true"></div>

      <div class="tour-header-row">
        <span class="tour-step-pill" id="tour-step-counter">PASSO 1 DE 9 · MENU LATERAL</span>
        <button type="button" class="tour-skip-top-btn" id="tour-btn-skip-top" popovertarget="farol-tour-popover" popovertargetaction="hide">
          Pular tour ✕
        </button>
      </div>

      <h2 class="tour-title" id="tour-step-title">1. Navegação Principal &amp; Estratégica</h2>
      <p class="tour-desc" id="tour-step-desc">
        No menu lateral você alterna entre o controle do dia a dia e o planejamento de longo prazo.
      </p>

      <div class="tour-tip-box" id="tour-step-tip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span id="tour-step-tip-text">Dica: Você também pode navegar usando as setas ← e → do teclado.</span>
      </div>

      <div class="tour-footer-row">
        <div class="tour-dots" id="tour-dots-container" role="tablist" aria-label="Passos do tour"></div>

        <div class="tour-nav-btns">
          <button type="button" class="tour-btn-skip" id="tour-btn-skip-footer" popovertarget="farol-tour-popover" popovertargetaction="hide">
            Pular
          </button>
          <button type="button" class="tour-btn-prev" id="tour-btn-prev">
            ← Anterior
          </button>
          <button type="button" class="tour-btn-next" id="tour-btn-next" data-tour-primary>
            Próximo →
          </button>
        </div>
      </div>
    </div>
  </dialog>

  <div id="chart-tooltip" role="tooltip"></div>`;
