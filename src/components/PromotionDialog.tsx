import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { BoardMove } from '../game/types';

type PromotionDialogProps = {
  move: BoardMove | null;
  onChoose: (promote: boolean) => void;
};

export function PromotionDialog({ move, onChoose }: PromotionDialogProps) {
  const promoteButtonRef = useRef<HTMLButtonElement>(null);
  const keepButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (move) {
      promoteButtonRef.current?.focus();
    }
  }, [move]);

  if (!move) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onChoose(false);
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableButtons = [promoteButtonRef.current, keepButtonRef.current].filter(
      (button): button is HTMLButtonElement => button !== null,
    );
    if (focusableButtons.length === 0) return;

    const currentIndex = focusableButtons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? focusableButtons.length - 1
        : currentIndex - 1
      : currentIndex === focusableButtons.length - 1
        ? 0
        : currentIndex + 1;

    event.preventDefault();
    focusableButtons[nextIndex].focus();
  };

  return (
    <div
      className="promotion-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-dialog-title"
      aria-describedby="promotion-dialog-description"
      onKeyDown={handleKeyDown}
    >
      <p id="promotion-dialog-title">Promote this piece?</p>
      <p id="promotion-dialog-description" className="sr-only">
        Choose Promote to promote this move, or Keep to leave the piece unpromoted.
      </p>
      <div className="dialog-actions">
        <button ref={promoteButtonRef} type="button" onClick={() => onChoose(true)}>
          Promote
        </button>
        <button ref={keepButtonRef} type="button" onClick={() => onChoose(false)}>
          Keep
        </button>
      </div>
    </div>
  );
}
