import { Redo2, Undo2 } from 'lucide-react';
import type { MoveHistoryEntry } from '../game/types';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
  reviewIndex: number;
  latestIndex: number;
  currentMoveIndex: number | null;
  canUndo: boolean;
  canRedo: boolean;
  activeControlsDisabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLatest: () => void;
};

const reviewText = (reviewIndex: number, latestIndex: number) => {
  if (latestIndex === 0) return 'Viewing start position';
  if (reviewIndex === 0) return 'Viewing start position';
  if (reviewIndex === latestIndex) return 'Viewing latest position';
  return `Viewing move ${reviewIndex} of ${latestIndex}`;
};

export function MoveHistory({
  history,
  reviewIndex,
  latestIndex,
  currentMoveIndex,
  canUndo,
  canRedo,
  activeControlsDisabled,
  onUndo,
  onRedo,
  onPrevious,
  onNext,
  onLatest,
}: MoveHistoryProps) {
  return (
    <section className="move-history" aria-label="Move history">
      <h2>Move history</h2>
      <p className="review-status">{reviewText(reviewIndex, latestIndex)}</p>
      <div className="active-game-controls" aria-label="Active game controls">
        <button type="button" onClick={onUndo} disabled={!canUndo || activeControlsDisabled}>
          <Undo2 size={18} aria-hidden="true" />
          Undo move
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo || activeControlsDisabled}>
          <Redo2 size={18} aria-hidden="true" />
          Redo move
        </button>
      </div>
      <div className="history-controls">
        <button type="button" onClick={onPrevious} disabled={reviewIndex === 0}>
          Previous move
        </button>
        <button type="button" onClick={onNext} disabled={reviewIndex === latestIndex}>
          Next move
        </button>
        <button type="button" onClick={onLatest} disabled={reviewIndex === latestIndex}>
          Latest position
        </button>
      </div>
      {history.length === 0 ? (
        <p className="empty-history">No moves yet</p>
      ) : (
        <ol>
          {history.map((entry, index) => (
            <li key={entry.id} aria-current={currentMoveIndex === index + 1 ? 'step' : undefined}>
              {entry.label}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
