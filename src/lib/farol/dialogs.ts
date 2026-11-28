/* eslint-disable @typescript-eslint/no-explicit-any */
let farolSupportsDisplayTransition: boolean | undefined;

export function canTransitionDisplay(): boolean {
  if (farolSupportsDisplayTransition !== undefined) return farolSupportsDisplayTransition;
  if (
    typeof window === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  farolSupportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return farolSupportsDisplayTransition;
}

export function supportsTopLayerExit(): boolean {
  return typeof window !== 'undefined' && Boolean(window.CSS?.supports?.('overlay', 'auto')) && canTransitionDisplay();
}

export async function closeTopLayerModal(dialogEl: any, immediate = false): Promise<void> {
  if (!dialogEl) return;
  if (typeof dialogEl.close !== 'function') {
    dialogEl.classList?.remove('open');
    return;
  }
  if (!dialogEl.open) {
    dialogEl.classList?.remove('open');
    return;
  }
  if (immediate || supportsTopLayerExit()) {
    dialogEl.removeAttribute?.('data-closing');
    dialogEl.classList?.remove('open');
    dialogEl.close();
    return;
  }
  if (dialogEl.hasAttribute?.('data-closing')) return;
  dialogEl.setAttribute('data-closing', '');
  const animations =
    typeof dialogEl.getAnimations === 'function' ? dialogEl.getAnimations({ subtree: true }) : [];
  if (animations.length > 0) {
    await Promise.race([
      Promise.allSettled(animations.map((a: Animation) => a.finished)),
      new Promise((r) => setTimeout(r, 320)),
    ]);
  }
  if (!dialogEl.hasAttribute('data-closing')) return;
  dialogEl.removeAttribute('data-closing');
  dialogEl.classList?.remove('open');
  if (dialogEl.open) dialogEl.close();
}

export function openFarolModal(
  modalOrId: string | HTMLElement | null,
  onTrack?: (eventType: string, target: string, label: string) => void
): void {
  const modal: any = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
  if (!modal) return;
  modal.removeAttribute?.('data-closing');
  if (modal.id && onTrack) {
    onTrack('modal_open', modal.id, modal.querySelector?.('.modal-title')?.textContent?.trim() || modal.id);
  }
  if (typeof modal.showModal === 'function') {
    if (!modal.open) {
      try {
        modal.showModal();
      } catch {
        modal.setAttribute?.('open', '');
      }
    }
  } else {
    modal.classList?.add('open');
  }
}

export function closeFarolModal(modalOrId: string | HTMLElement | null, immediate = false): void {
  const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
  if (!modal) return;
  closeTopLayerModal(modal, immediate);
}

export function setupFarolDialogs(): void {
  if (typeof document === 'undefined') return;
  const needsClosedByFallback =
    typeof HTMLDialogElement === 'function' && !('closedBy' in HTMLDialogElement.prototype);

  document.querySelectorAll<HTMLDialogElement>('dialog.modal-dialog').forEach((dialog) => {
    if (dialog.dataset?.dialogBound === '1') return;
    if (dialog.dataset) dialog.dataset.dialogBound = '1';
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeTopLayerModal(dialog, false);
    });
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
      dialog.removeAttribute?.('data-closing');
      dialog.classList?.remove('open');
    });
    if (needsClosedByFallback && dialog.getAttribute('closedby') === 'any') {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e)) closeTopLayerModal(dialog, false);
        pressedOutside = false;
      });
    }
  });
}
