export const FAROL_SHELL_HTML = `<div class="app-shell">
    <!-- ==================== SIDEBAR ==================== -->
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-logo" title="Farol FinanÃ§as">
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

        <div class="nav-section-label">PRINCIPAL</div>
        <ul class="nav-list" id="nav-principal">
          <li>
            <button class="nav-item active" data-tab="visao-geral">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>VisÃ£o geral</span>
            </button>
          </li>
          <li>
            <button class="nav-item" data-tab="transacoes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
              <span>TransaÃ§Ãµes</span>
            </button>
          </li>
          <li>
            <button class="nav-item" data-tab="recorrencias">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              <span>RecorrÃªncias</span>
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

        <div class="nav-section-label" style="margin-top: 10px;">VISÃƒO ESTRATÃ‰GICA</div>
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
              <span>PatrimÃ´nio</span>
            </button>
          </li>
          <li>
            <button class="nav-item" data-tab="projecao">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              <span>ProjeÃ§Ã£o</span>
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

      <!-- Perfil do UsuÃ¡rio -->
      <div class="sidebar-footer" id="profile-trigger" title="Clique para editar seu perfil e orÃ§amento mensal">
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
          <h1 class="page-title" id="page-title">VisÃ£o geral</h1>
          <p class="page-subtitle" id="page-subtitle">Novembro de 2026 Â· 18 dias restantes</p>
        </div>

        <div class="topbar-actions">
          <!-- Seletor de MÃªs -->
          <select id="month-selector" class="month-pill" aria-label="Selecionar mÃªs">
            <option value="2026-09">setembro de 2026 â–¾</option>
            <option value="2026-10">outubro de 2026 â–¾</option>
            <option value="2026-11" selected>novembro de 2026 â–¾</option>
            <option value="2026-12">dezembro de 2026 â–¾</option>
            <option value="2027-01">janeiro de 2027 â–¾</option>
            <option value="2027-02">fevereiro de 2027 â–¾</option>
            <option value="2027-03">marÃ§o de 2027 â–¾</option>
            <option value="2027-04">abril de 2027 â–¾</option>
            <option value="2027-05">maio de 2027 â–¾</option>
            <option value="2027-06">junho de 2027 â–¾</option>
          </select>

          <!-- BotÃ£o Tema Claro / Escuro -->
          <button class="icon-circle-btn" id="theme-toggle-btn" title="Alternar tema claro/escuro" aria-label="Alternar tema">
            <svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          </button>

          <!-- BotÃ£o Ocultar/Mostrar Valores -->
          <button class="icon-circle-btn" id="privacy-toggle-btn" title="Mostrar/Ocultar valores">
            <svg id="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>

          <!-- BotÃ£o Nova TransaÃ§Ã£o (+) -->
          <button class="add-circle-btn" id="quick-add-btn" title="Adicionar lanÃ§amento (+)">+</button>
        </div>
      </header>

      <!-- Container DinÃ¢mico das Abas -->
      <div id="view-container"></div>
    </main>
  </div>

  <!-- ==================== MODAL: LANÃ‡AMENTO RÃPIDO (ATÃ‰ 3 TOQUES) ==================== -->
  <div class="modal-backdrop" id="modal-transaction">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-tx-title">LanÃ§amento RÃ¡pido</h3>
        <button type="button" class="modal-close-btn" data-close-modal="modal-transaction" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-transaction">
        <input type="hidden" id="tx-id" />
        <input type="hidden" id="tx-category" />

        <div class="quick-amount-hero">
          <span class="quick-amount-prefix">R$</span>
          <input type="number" step="0.01" min="0.01" id="tx-amount" class="quick-amount-input" placeholder="0,00" required />
          <select id="tx-type" class="form-select" style="width:auto; min-width:110px;">
            <option value="expense">SaÃ­da</option>
            <option value="income">Entrada</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Categoria (mais usadas primeiro)</label>
          <div id="quick-cat-chips" class="quick-cat-chips"></div>
        </div>

        <details class="quick-more-details" id="quick-more-details">
          <summary>+ Mais opÃ§Ãµes (descriÃ§Ã£o, tag, conta, parcelas, recorrÃªncia)</summary>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">DescriÃ§Ã£o (opcional)</label>
              <input type="text" id="tx-desc" class="form-input" placeholder="Ex: iFood / Mercado" />
            </div>
            <div class="form-group">
              <label class="form-label">Tag (opcional)</label>
              <input type="text" id="tx-tag" class="form-input" placeholder="Ex: trabalho, viagem" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Conta / CartÃ£o</label>
              <select id="tx-account" class="form-select" required></select>
            </div>
            <div class="form-group">
              <label class="form-label">Data</label>
              <input type="date" id="tx-date" class="form-input" required />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">MÃ©todo</label>
              <select id="tx-method" class="form-select">
                <option value="Conta Corrente / Pix">Pix / DÃ©bito</option>
                <option value="CartÃ£o de CrÃ©dito">CartÃ£o de CrÃ©dito</option>
              </select>
            </div>
            <div class="form-group" id="tx-installments-wrap" style="display:none;">
              <label class="form-label">Parcelas</label>
              <div style="display:flex; align-items:center; gap:8px;">
                <select id="tx-installments" class="form-select" style="flex:1;">
                  <option value="1">1x (Ã€ vista)</option>
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
                </select>
                <span id="tx-installment-preview" style="font-size:11.5px; color:var(--cyan-accent); white-space:nowrap;"></span>
              </div>
            </div>
          </div>
          <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--text-secondary); cursor:pointer; margin-top:4px;">
            <input type="checkbox" id="tx-is-recurring" />
            Repetir mensalmente (salvar em RecorrÃªncias)
          </label>
        </details>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" data-close-modal="modal-transaction">Cancelar</button>
          <button type="submit" class="btn-primary">Confirmar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: PERFIL & ORÃ‡AMENTO ==================== -->
  <div class="modal-backdrop" id="modal-profile">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">ConfiguraÃ§Ãµes & OrÃ§amento</h3>
        <button type="button" class="modal-close-btn" data-close-modal="modal-profile" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-profile">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">UsuÃ¡rio Ativo (dados isolados)</label>
            <select id="prof-user-select" class="form-select"></select>
          </div>
          <div class="form-group">
            <label class="form-label">Novo UsuÃ¡rio</label>
            <div style="display:flex; gap:6px;">
              <input type="text" id="prof-new-user" class="form-input" placeholder="Ex: Maria" />
              <button type="button" class="btn-secondary" id="btn-create-user" style="white-space:nowrap;">+ Criar</button>
            </div>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Seu Nome</label>
            <input type="text" id="prof-name" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Plano / SubtÃ­tulo</label>
            <input type="text" id="prof-plan" class="form-input" required />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">SalÃ¡rio Mensal Fixo (R$)</label>
            <input type="number" step="0.01" min="0" id="prof-salary" class="form-input" placeholder="0,00" />
          </div>
          <div class="form-group">
            <label class="form-label">Dia do Recebimento</label>
            <input type="number" min="1" max="31" id="prof-salary-day" class="form-input" value="5" />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">OrÃ§amento Mensal (R$)</label>
            <input type="number" step="0.01" min="0" id="prof-budget" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Meta Reserva EmergÃªncia (R$)</label>
            <input type="number" step="0.01" min="1" id="prof-reserve-goal" class="form-input" required />
          </div>
        </div>
        <div class="modal-actions-split">
          <button type="button" class="btn-danger-ghost" id="btn-reset-demo">Restaurar Modelo (R$ 55,00)</button>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-secondary" data-close-modal="modal-profile">Fechar</button>
            <button type="submit" class="btn-primary">Salvar</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: EDITAR FATURA / CARTÃƒO ==================== -->
  <div class="modal-backdrop" id="modal-invoice">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-inv-title">Editar Fatura</h3>
        <button type="button" class="modal-close-btn" data-close-modal="modal-invoice" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-invoice">
        <input type="hidden" id="inv-account-id" />
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nome do CartÃ£o / Conta</label>
            <input type="text" id="inv-name" class="form-input" placeholder="Ex: CartÃ£o Black" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status da Fatura</label>
            <select id="inv-status" class="form-select">
              <option value="open">Aberta</option>
              <option value="closed">Fechada</option>
              <option value="paid">Paga</option>
            </select>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Limite Total (R$)</label>
            <input type="number" step="0.01" min="1" id="inv-limit" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Ajuste / Valor Avulso (R$)</label>
            <input type="number" step="0.01" id="inv-manual-adj" class="form-input" placeholder="0,00" />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Dia de Fechamento</label>
            <input type="number" min="1" max="31" id="inv-closing-day" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Dia de Vencimento</label>
            <input type="number" min="1" max="31" id="inv-due-day" class="form-input" required />
          </div>
        </div>
        <div class="modal-actions-split">
          <button type="button" class="btn-danger-ghost" id="btn-delete-invoice">Excluir CartÃ£o</button>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-secondary" data-close-modal="modal-invoice">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar Fatura</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: ATIVO / PATRIMÃ”NIO ==================== -->
  <div class="modal-backdrop" id="modal-asset">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-asset-title">Editar Ativo</h3>
        <button type="button" class="modal-close-btn" data-close-modal="modal-asset" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-asset">
        <input type="hidden" id="ast-id" />
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nome do Ativo</label>
            <input type="text" id="ast-name" class="form-input" placeholder="Ex: CDB Liquidez DiÃ¡ria" required />
          </div>
          <div class="form-group">
            <label class="form-label">Classe</label>
            <select id="ast-category" class="form-select">
              <option value="Renda Fixa (CDB)">Renda Fixa (CDB)</option>
              <option value="Tesouro Direto">Tesouro Direto</option>
              <option value="FIIs">FIIs</option>
              <option value="AÃ§Ãµes">AÃ§Ãµes</option>
              <option value="Cripto">Cripto</option>
              <option value="Reserva / Outros">Reserva / Outros</option>
            </select>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Saldo Atual (R$)</label>
            <input type="number" step="0.01" min="0" id="ast-amount" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">% do CDI / CDB</label>
            <input type="number" step="0.5" min="0" max="500" id="ast-cdb-pct" class="form-input" placeholder="100" required />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">InstituiÃ§Ã£o</label>
            <input type="text" id="ast-institution" class="form-input" placeholder="Ex: Nubank, Inter, XP" />
          </div>
          <div class="form-group">
            <label class="form-label">Liquidez</label>
            <select id="ast-liquidity" class="form-select">
              <option value="DiÃ¡ria">Liquidez DiÃ¡ria</option>
              <option value="D+1">D+1</option>
              <option value="D+30">D+30</option>
              <option value="No Vencimento">No Vencimento</option>
            </select>
          </div>
        </div>
        <div class="modal-actions-split">
          <button type="button" class="btn-danger-ghost" id="btn-delete-asset">Excluir Ativo</button>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-secondary" data-close-modal="modal-asset">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar Ativo</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: CATEGORIA & REGRAS AUTOMÃTICAS ==================== -->
  <div class="modal-backdrop" id="modal-category">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-cat-title">Nova Categoria</h3>
        <button type="button" class="modal-close-btn" data-close-modal="modal-category" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-category">
        <input type="hidden" id="cat-id" />
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nome da Categoria</label>
            <input type="text" id="cat-name" class="form-input" placeholder="Ex: Delivery" required />
          </div>
          <div class="form-group">
            <label class="form-label">Cor</label>
            <input type="color" id="cat-color" class="form-input" style="height:41px; padding:4px;" value="#38b6ff" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">OrÃ§amento Mensal (R$)</label>
          <input type="number" step="0.01" min="0" id="cat-budget" class="form-input" placeholder="150,00" required />
        </div>
        <div class="form-group">
          <label class="form-label">Regras AutomÃ¡ticas (palavras-chave separadas por vÃ­rgula)</label>
          <input type="text" id="cat-rules" class="form-input" placeholder="Ex: ifood, rappi, lanche, pizza" />
        </div>
        <div class="modal-actions-split">
          <button type="button" class="btn-danger-ghost" id="btn-archive-category">Arquivar Categoria</button>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-secondary" data-close-modal="modal-category">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar Categoria</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: NOVA RECORRÃŠNCIA ==================== -->
  <div class="modal-backdrop" id="modal-recurrence">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Nova RecorrÃªncia</h3>
        <button type="button" class="modal-close-btn" data-close-modal="modal-recurrence" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-recurrence">
        <div class="form-group">
          <label class="form-label">Nome da assinatura ou conta fixa</label>
          <input type="text" id="rec-desc" class="form-input" placeholder="Ex: Academia, Aluguel, Internet" required />
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Valor mensal (R$)</label>
            <input type="number" step="0.01" min="0.01" id="rec-amount" class="form-input" placeholder="89,90" required />
          </div>
          <div class="form-group">
            <label class="form-label">Dia do vencimento (1 a 31)</label>
            <input type="number" min="1" max="31" id="rec-day" class="form-input" value="10" required />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select id="rec-type" class="form-select">
              <option value="expense">SaÃ­da (Despesa)</option>
              <option value="income">Entrada (Receita)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select id="rec-category" class="form-select"></select>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" data-close-modal="modal-recurrence">Cancelar</button>
          <button type="submit" class="btn-primary">Salvar RecorrÃªncia</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: NOVA CONTA / CARTÃƒO ==================== -->
  <div class="modal-backdrop" id="modal-account">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Nova Conta ou CartÃ£o</h3>
        <button type="button" class="modal-close-modal modal-close-btn" data-close-modal="modal-account" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-account">
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Nome do Banco ou CartÃ£o</label>
            <input type="text" id="acc-name" class="form-input" placeholder="Ex: Nubank, ItaÃº, Inter" required />
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select id="acc-type" class="form-select">
              <option value="Conta Corrente">Conta Corrente</option>
              <option value="CartÃ£o de CrÃ©dito">CartÃ£o de CrÃ©dito</option>
            </select>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Saldo inicial (R$)</label>
            <input type="number" step="0.01" id="acc-balance" class="form-input" value="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Limite disponÃ­vel (R$)</label>
            <input type="number" step="0.01" min="0" id="acc-limit" class="form-input" value="3000.00" />
          </div>
        </div>
        <div class="form-row-2" id="acc-card-dates-row">
          <div class="form-group">
            <label class="form-label">Dia de fechamento</label>
            <input type="number" min="1" max="31" id="acc-closing-day" class="form-input" value="5" />
          </div>
          <div class="form-group">
            <label class="form-label">Dia de vencimento</label>
            <input type="number" min="1" max="31" id="acc-due-day" class="form-input" value="12" />
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" data-close-modal="modal-account">Cancelar</button>
          <button type="submit" class="btn-primary">Salvar Conta</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== MODAL: DIÃLOGO ESTILIZADO (CONFIRMAÃ‡ÃƒO / INPUT) ==================== -->
  <div class="modal-backdrop" id="modal-dialog">
    <div class="modal-card" style="max-width:420px;">
      <div class="modal-header">
        <h3 class="modal-title" id="dialog-title">Confirmar aÃ§Ã£o</h3>
        <button type="button" class="modal-close-btn" id="dialog-close-x" aria-label="Fechar">âœ•</button>
      </div>
      <form id="form-dialog">
        <p id="dialog-message" style="font-size:13.5px; color:var(--text-secondary); line-height:1.5; margin-bottom:14px;"></p>
        <div class="form-group" id="dialog-input-wrap" style="display:none;">
          <label class="form-label" id="dialog-input-label">Valor</label>
          <input type="text" id="dialog-input" class="form-input" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="dialog-cancel-btn">Cancelar</button>
          <button type="submit" class="btn-primary" id="dialog-confirm-btn">Confirmar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast de Desfazer EdiÃ§Ã£o em Lote -->
  <div id="undo-toast" role="status">
    <span id="undo-toast-msg">AlteraÃ§Ã£o em lote aplicada.</span>
    <button type="button" class="btn-primary" id="btn-undo-batch" style="padding:5px 12px; font-size:12px;">Desfazer</button>
  </div>

  <div id="chart-tooltip" role="tooltip"></div>`;
