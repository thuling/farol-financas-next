/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ProductTourStep {
  id: string;
  view: string;
  tag: string;
  selector: string;
  preferredSide: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  desc: string;
  tip: string;
}

export interface ProductTourDeps {
  getState: () => Record<string, any>;
  getActiveUserId: () => string;
  saveState: () => void;
  renderApp: () => void;
}

export const FAROL_PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    id: 'sidebar',
    view: 'visao-geral',
    tag: 'MENU LATERAL',
    selector: '.sidebar-nav-scroll',
    preferredSide: 'right',
    title: '1. Navegação Principal & Estratégica',
    desc: 'No menu lateral você alterna entre o controle do dia a dia (Visão Geral, Transações, Recorrências, Fluxo de Caixa, Faturas e Categorias) e o planejamento de longo prazo (Metas, Patrimônio, Projeção e Contas).',
    tip: 'Cada aba preserva o mês selecionado no topo para análise rápida.',
  },
  {
    id: 'topbar',
    view: 'visao-geral',
    tag: 'CONTROLES DO TOPO',
    selector: '.topbar-actions',
    preferredSide: 'bottom',
    title: '2. Mês, Sincronização, Tema e Privacidade',
    desc: 'Troque o mês de referência, acompanhe o status da sincronização na nuvem (PostgreSQL), alterne entre tema escuro/claro ou oculte todos os valores monetários com o modo privacidade (👁).',
    tip: 'Use também as setas ← e → do teclado para avançar ou voltar neste tour.',
  },
  {
    id: 'quick-add',
    view: 'visao-geral',
    tag: 'AÇÃO RÁPIDA',
    selector: '#quick-add-btn',
    preferredSide: 'bottom',
    title: '3. Botão (+) Lançamento Rápido',
    desc: 'Registre qualquer despesa ou receita em segundos, à vista ou parcelada no cartão. O sistema classifica automaticamente a categoria por palavras-chave e distribui as parcelas nas faturas futuras sem duplicar.',
    tip: 'Atalho disponível no canto superior direito em todas as telas.',
  },
  {
    id: 'overview-top',
    view: 'visao-geral',
    tag: 'VISÃO GERAL',
    selector: '.card-partial-enriched',
    preferredSide: 'bottom',
    title: '4. Resultado Parcial & Projeção do Mês',
    desc: 'Veja seu saldo parcial com a pill de Taxa de Economia (+XX% economizado), o comparativo entre Entradas e Saídas e a Projeção de fechamento do mês descontando faturas e recorrências pendentes.',
    tip: 'A barra fina verde e vermelha mostra a proporção exata entre entradas e saídas.',
  },
  {
    id: 'overview-cards',
    view: 'visao-geral',
    tag: 'INSIGHTS & FATURAS',
    selector: '.card-insights-enriched',
    preferredSide: 'top',
    title: '5. Ritmo Diário Seguro & Limite de Faturas',
    desc: 'O card de Insights calcula automaticamente quanto você pode gastar por dia (Orçamento livre/dia), enquanto logo abaixo os cards de Faturas e Metas mostram o limite utilizado e o aporte mensal sugerido.',
    tip: 'Use as setas ‹ 1/2 › no topo dos Insights quando houver leituras extras.',
  },
  {
    id: 'tx-toolbar',
    view: 'transacoes',
    tag: 'ABA TRANSAÇÕES',
    selector: '#tour-tx-toolbar',
    preferredSide: 'bottom',
    title: '6. Importação Inteligente de Faturas & Extratos',
    desc: 'Na aba Transações você pode importar arquivos CSV, Markdown (.md), PDF ou foto da fatura com leitura automática de parcelas, ou adicionar novos lançamentos diretamente.',
    tip: 'O sistema detecta parcelas já existentes para evitar lançamentos duplicados.',
  },
  {
    id: 'tx-filters',
    view: 'transacoes',
    tag: 'FILTROS COMBINÁVEIS',
    selector: '#tour-tx-filters',
    preferredSide: 'bottom',
    title: '7. Busca & Filtro por Intervalo de Datas (De / Até)',
    desc: 'Combine busca por texto, período rápido (Hoje, 7 dias, 30 dias), intervalo exato de datas (De / Até), tipo (Entrada/Saída), categoria, conta, método de pagamento ou #tag.',
    tip: 'A faixa abaixo dos filtros recalcula Entradas, Saídas e Saldo do filtro em tempo real.',
  },
  {
    id: 'tx-thead',
    view: 'transacoes',
    tag: 'TABELA & COLUNAS',
    selector: '#tour-tx-thead',
    preferredSide: 'top',
    title: '8. Colunas Ordenáveis & Ações Rápidas',
    desc: 'Clique em DATA, DESCRIÇÃO / TAG, CATEGORIA, CONTA / MÉTODO, TIPO ou VALOR para ordenar seus lançamentos. Marque as caixas à esquerda para edição em lote ou use AÇÕES para Editar e Excluir.',
    tip: 'Ao excluir qualquer lançamento, um aviso permite Desfazer a ação imediatamente.',
  },
  {
    id: 'profile',
    view: 'visao-geral',
    tag: 'PERFIL & TETO MENSAL',
    selector: '#profile-trigger',
    preferredSide: 'right',
    title: '9. Perfil, Orçamento Mensal & Reserva',
    desc: 'Clique no seu perfil no rodapé da barra lateral para ajustar seu nome, definir seu orçamento mensal de gastos e configurar a meta da sua Reserva de Emergência.',
    tip: 'Tudo pronto! Clique em Concluir para começar a usar o Farol Finanças.',
  },
];

export function createProductTourController(deps: ProductTourDeps) {
  let productTourOpen = false;
  let productTourStepIdx = 0;
  let productTourBound = false;
  let productTourAutoTriggered = false;

  function getProductTourStorageKey(): string {
    const uid = deps.getActiveUserId() || 'user-default';
    return `farol_product_tour_done_v1_${uid}`;
  }

  function hasCompletedProductTour(): boolean {
    const st = deps.getState();
    if (st && st.productTourCompleted === true) return true;
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(getProductTourStorageKey()) === '1';
    } catch {
      return false;
    }
  }

  function markProductTourCompleted(): void {
    const st = deps.getState();
    if (st && typeof st === 'object') {
      st.productTourCompleted = true;
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(getProductTourStorageKey(), '1');
      } catch {}
    }
    deps.saveState();
  }

  function openTourPopoverElement(popoverEl: any): void {
    if (!popoverEl) return;
    if (typeof popoverEl.showPopover === 'function') {
      try {
        if (!popoverEl.matches(':popover-open')) {
          popoverEl.showPopover();
        }
      } catch {
        popoverEl.classList.add(':popover-open');
      }
    } else {
      popoverEl.classList.add(':popover-open');
    }
  }

  function closeFarolProductTour(markDone = true): void {
    productTourOpen = false;
    if (typeof document !== 'undefined' && document.body?.classList) {
      document.body.classList.remove('tour-active');
    }
    const backdropEl = document.getElementById('tour-backdrop-layer');
    const popoverEl: any = document.getElementById('farol-tour-popover');
    if (backdropEl) backdropEl.classList.add('is-hidden');
    if (popoverEl) {
      if (typeof popoverEl.hidePopover === 'function') {
        try {
          popoverEl.hidePopover();
        } catch {}
      }
      popoverEl.classList.remove(':popover-open');
    }
    if (markDone) {
      markProductTourCompleted();
    }
  }

  function positionProductTourStep(): void {
    if (!productTourOpen) return;
    const step = FAROL_PRODUCT_TOUR_STEPS[productTourStepIdx];
    if (!step) return;

    const target = document.querySelector(step.selector);
    const spotlightEl = document.getElementById('tour-spotlight-box');
    const popoverEl = document.getElementById('farol-tour-popover');
    const arrowEl = document.getElementById('tour-arrow');
    if (!target || !spotlightEl || !popoverEl || !arrowEl) return;

    let rect = target.getBoundingClientRect();
    if (rect.top < 16 || rect.bottom > window.innerHeight - 16) {
      try {
        target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' });
        rect = target.getBoundingClientRect();
      } catch {}
    }

    const pad = 8;
    const vw = Math.min(
      window.innerWidth || 1440,
      document.documentElement?.clientWidth || window.innerWidth || 1440
    );
    const vh = Math.min(
      window.innerHeight || 900,
      document.documentElement?.clientHeight || window.innerHeight || 900
    );
    const top = Math.round(Math.max(4, rect.top - pad));
    const left = Math.round(Math.max(4, rect.left - pad));
    const right = Math.round(Math.min(vw - 4, rect.right + pad));
    const bottom = Math.round(Math.min(vh - 4, rect.bottom + pad));
    const width = Math.max(24, right - left);
    const height = Math.max(24, bottom - top);

    spotlightEl.style.top = `${top}px`;
    spotlightEl.style.left = `${left}px`;
    spotlightEl.style.width = `${width}px`;
    spotlightEl.style.height = `${height}px`;
    spotlightEl.style.borderRadius = rect.width < 60 && rect.height < 60 ? '999px' : '14px';

    const popWidth = popoverEl.offsetWidth || Math.min(408, window.innerWidth - 24);
    const popHeight = popoverEl.offsetHeight || 238;
    const gap = 14;
    const margin = 12;

    const spaceRight = window.innerWidth - (left + width) - margin;
    const spaceLeft = left - margin;
    const spaceBottom = window.innerHeight - (top + height) - margin;
    const spaceTop = top - margin;

    const canFit = (side: string) => {
      if (side === 'right') return spaceRight >= popWidth + gap;
      if (side === 'left') return spaceLeft >= popWidth + gap;
      if (side === 'bottom') return spaceBottom >= popHeight + gap;
      if (side === 'top') return spaceTop >= popHeight + gap;
      return false;
    };

    let chosenSide: string = step.preferredSide || 'bottom';
    if (!canFit(chosenSide)) {
      const order = ['bottom', 'top', 'right', 'left'];
      const fitting = order.find((s) => canFit(s));
      if (fitting) {
        chosenSide = fitting;
      } else {
        chosenSide = spaceBottom >= spaceTop ? 'bottom' : 'top';
      }
    }

    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;
    let popTop = 0;
    let popLeft = 0;
    let arrowDir = 'top';
    let arrowOffset = 28;

    if (chosenSide === 'right') {
      popLeft = Math.min(window.innerWidth - popWidth - margin, left + width + gap);
      popTop = Math.max(margin, Math.min(window.innerHeight - popHeight - margin, targetCenterY - popHeight / 2));
      arrowDir = 'left';
      arrowOffset = Math.max(20, Math.min(popHeight - 28, targetCenterY - popTop - 6));
    } else if (chosenSide === 'left') {
      popLeft = Math.max(margin, left - popWidth - gap);
      popTop = Math.max(margin, Math.min(window.innerHeight - popHeight - margin, targetCenterY - popHeight / 2));
      arrowDir = 'right';
      arrowOffset = Math.max(20, Math.min(popHeight - 28, targetCenterY - popTop - 6));
    } else if (chosenSide === 'top') {
      popTop = Math.max(margin, top - popHeight - gap);
      popLeft = Math.max(margin, Math.min(window.innerWidth - popWidth - margin, targetCenterX - popWidth / 2));
      arrowDir = 'bottom';
      arrowOffset = Math.max(22, Math.min(popWidth - 30, targetCenterX - popLeft - 6));
    } else {
      popTop = Math.min(window.innerHeight - popHeight - margin, top + height + gap);
      popLeft = Math.max(margin, Math.min(window.innerWidth - popWidth - margin, targetCenterX - popWidth / 2));
      arrowDir = 'top';
      arrowOffset = Math.max(22, Math.min(popWidth - 30, targetCenterX - popLeft - 6));
    }

    popoverEl.style.top = `${Math.round(popTop)}px`;
    popoverEl.style.left = `${Math.round(popLeft)}px`;
    arrowEl.setAttribute('data-dir', arrowDir);
    arrowEl.style.setProperty('--arrow-offset', `${Math.round(arrowOffset)}px`);
  }

  function renderProductTourStep(): void {
    const step = FAROL_PRODUCT_TOUR_STEPS[productTourStepIdx];
    if (!step) return;

    productTourOpen = true;
    if (typeof document !== 'undefined' && document.body?.classList) {
      document.body.classList.add('tour-active');
    }

    const st = deps.getState();
    if (st && st.currentTab !== step.view) {
      st.currentTab = step.view;
      deps.renderApp();
    }

    const backdropEl = document.getElementById('tour-backdrop-layer');
    const popoverEl = document.getElementById('farol-tour-popover');
    const counterEl = document.getElementById('tour-step-counter');
    const titleEl = document.getElementById('tour-step-title');
    const descEl = document.getElementById('tour-step-desc');
    const tipTextEl = document.getElementById('tour-step-tip-text');
    const dotsContainer = document.getElementById('tour-dots-container');
    const btnPrev = document.getElementById('tour-btn-prev') as HTMLButtonElement | null;
    const btnNext = document.getElementById('tour-btn-next') as HTMLButtonElement | null;

    if (!backdropEl || !popoverEl) return;

    backdropEl.classList.remove('is-hidden');
    openTourPopoverElement(popoverEl);

    if (counterEl) {
      counterEl.textContent = `PASSO ${productTourStepIdx + 1} DE ${FAROL_PRODUCT_TOUR_STEPS.length} · ${step.tag}`;
    }
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.desc;
    if (tipTextEl) tipTextEl.textContent = step.tip;
    if (btnPrev) btnPrev.disabled = productTourStepIdx === 0;
    if (btnNext) {
      btnNext.textContent =
        productTourStepIdx === FAROL_PRODUCT_TOUR_STEPS.length - 1 ? 'Concluir ✓' : 'Próximo →';
    }

    if (dotsContainer) {
      dotsContainer.innerHTML = FAROL_PRODUCT_TOUR_STEPS.map((_, idx) => {
        const cls =
          idx === productTourStepIdx
            ? 'tour-dot active'
            : idx < productTourStepIdx
              ? 'tour-dot completed'
              : 'tour-dot';
        return `<button type="button" class="${cls}" data-tour-dot="${idx}" aria-label="Ir para o passo ${idx + 1}"></button>`;
      }).join('');
      dotsContainer.querySelectorAll<HTMLButtonElement>('[data-tour-dot]').forEach((dotBtn) => {
        dotBtn.addEventListener('click', () => {
          const targetIdx = parseInt(dotBtn.dataset.tourDot || '', 10);
          if (!Number.isNaN(targetIdx)) {
            goToFarolTourStep(targetIdx);
          }
        });
      });
    }

    const raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: () => void) => setTimeout(cb, 0);

    raf(() => {
      positionProductTourStep();
      setTimeout(() => {
        if (productTourOpen) positionProductTourStep();
      }, 120);
      if (btnNext) {
        try {
          btnNext.focus({ preventScroll: true });
        } catch {}
      }
    });
  }

  function goToFarolTourStep(idx: number): void {
    if (idx < 0 || idx >= FAROL_PRODUCT_TOUR_STEPS.length) return;
    productTourStepIdx = idx;
    renderProductTourStep();
  }

  function startFarolProductTour(startIdx = 0): void {
    bindProductTourEvents();
    productTourStepIdx = Math.max(0, Math.min(FAROL_PRODUCT_TOUR_STEPS.length - 1, Number(startIdx) || 0));
    renderProductTourStep();
  }

  function maybeAutoStartProductTour(): void {
    if (typeof window === 'undefined') return;
    const shell = document.getElementById('main-app-shell');
    if (!shell || shell.style.display === 'none') return;

    const forceTour = new URLSearchParams(window.location?.search || '').get('tour') === '1';
    if (!forceTour && (productTourAutoTriggered || hasCompletedProductTour())) return;

    productTourAutoTriggered = true;
    setTimeout(() => {
      const shellNow = document.getElementById('main-app-shell');
      if (shellNow && shellNow.style.display !== 'none') {
        startFarolProductTour(0);
      }
    }, 180);
  }

  function bindProductTourEvents(): void {
    if (productTourBound || typeof window === 'undefined') return;
    productTourBound = true;

    const btnPrev = document.getElementById('tour-btn-prev');
    const btnNext = document.getElementById('tour-btn-next');
    const btnSkipTop = document.getElementById('tour-btn-skip-top');
    const btnSkipFooter = document.getElementById('tour-btn-skip-footer');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (productTourStepIdx > 0) {
          productTourStepIdx -= 1;
          renderProductTourStep();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (productTourStepIdx < FAROL_PRODUCT_TOUR_STEPS.length - 1) {
          productTourStepIdx += 1;
          renderProductTourStep();
        } else {
          closeFarolProductTour(true);
        }
      });
    }

    if (btnSkipTop) {
      btnSkipTop.addEventListener('click', () => closeFarolProductTour(true));
    }
    if (btnSkipFooter) {
      btnSkipFooter.addEventListener('click', () => closeFarolProductTour(true));
    }

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => {
        if (productTourOpen) positionProductTourStep();
      });

      window.addEventListener(
        'scroll',
        () => {
          if (productTourOpen) positionProductTourStep();
        },
        { passive: true }
      );

      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!productTourOpen) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          btnNext?.click();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          btnPrev?.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeFarolProductTour(true);
        }
      });
    }

    (window as any).startFarolProductTour = startFarolProductTour;
    (window as any).goToFarolTourStep = goToFarolTourStep;
    (window as any).closeFarolProductTour = closeFarolProductTour;
  }

  return {
    getProductTourStorageKey,
    hasCompletedProductTour,
    markProductTourCompleted,
    openTourPopoverElement,
    closeFarolProductTour,
    positionProductTourStep,
    renderProductTourStep,
    goToFarolTourStep,
    startFarolProductTour,
    maybeAutoStartProductTour,
    bindProductTourEvents,
  };
}
