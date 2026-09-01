import type { BoardMove } from '../game/types';

type PromotionDialogProps = {
  move: BoardMove | null;
  onChoose: (promote: boolean) => void;
};

export function PromotionDialog({ move, onChoose }: PromotionDialogProps) {
  if (!move) return null;

  return (
    <div className="promotion-dialog" role="dialog" aria-modal="true" aria-label="Promotion choice">
      <p>Promote this piece?</p>
      <div className="dialog-actions">
        <button type="button" onClick={() => onChoose(true)}>
          Promote
        </button>
        <button type="button" onClick={() => onChoose(false)}>
          Keep
        </button>
      </div>
    </div>
  );
}
