'use client';

import { useEffect } from 'react';
import { FAROL_SHELL_HTML } from '@/lib/shell-html';
import { initFarolApp } from '@/lib/farol-engine';

export function FarolApp() {
  useEffect(() => {
    initFarolApp();
  }, []);

  return (
    <div
      id="farol-root"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: FAROL_SHELL_HTML }}
    />
  );
}
