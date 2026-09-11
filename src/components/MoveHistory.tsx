import type { MoveHistoryEntry } from '../game/types';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
  reviewIndex: number;
  latestIndex: number;
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

export function MoveHistory({ history, reviewIndex, latestIndex, onPrevious, onNext, onLatest }: MoveHistoryProps) {
  return (
    <section className="move-history" aria-label="Move history">
      <h2>Move history</h2>
      <p className="review-status">{reviewText(reviewIndex, latestIndex)}</p>
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
          {history.map((entry) => (
            <li key={entry.id}>{entry.label}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
