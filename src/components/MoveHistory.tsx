import type { MoveHistoryEntry } from '../game/types';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
};

export function MoveHistory({ history }: MoveHistoryProps) {
  return (
    <section className="move-history" aria-label="Move history">
      <h2>Move history</h2>
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
