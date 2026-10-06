import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function FocusModal({ title, onClose, children, closeLabel = 'Tutup pemerhatian' }: { title: string; onClose: () => void; children: ReactNode; closeLabel?: string }) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function keyHandler(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Nested modals: only the topmost dialog reacts to Escape.
        const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
        if (dialogs[dialogs.length - 1] === ref.current) closeRef.current();
      }
      if (event.key === 'Tab') {
        const controls = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('keydown', keyHandler); document.body.style.overflow=previousOverflow; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop"><section className="modal observation-modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}><button className="close-button" aria-label={closeLabel} onClick={onClose}><X size={20}/></button>{children}</section></div>;
}
