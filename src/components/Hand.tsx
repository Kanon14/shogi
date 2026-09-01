import { HAND_PIECES, PIECE_LABELS } from './pieceLabels';
import type { Hand as GameHand, PieceKind, Player } from '../game/types';

type HandProps = {
  player: Player;
  hand: GameHand;
  activePiece: PieceKind | null;
  disabled: boolean;
  onPieceClick: (pieceKind: PieceKind) => void;
};

export function Hand({ player, hand, activePiece, disabled, onPieceClick }: HandProps) {
  const pieces = HAND_PIECES.filter((pieceKind) => (hand[pieceKind] ?? 0) > 0);

  return (
    <section className="hand" aria-label={`${player} hand`}>
      <h2>{player} hand</h2>
      {pieces.length === 0 ? <p className="empty-hand">No captured pieces</p> : null}
      <div className="hand-pieces">
        {pieces.map((pieceKind) => (
          <button
            key={pieceKind}
            type="button"
            className="hand-piece"
            data-selected={activePiece === pieceKind}
            disabled={disabled}
            onClick={() => onPieceClick(pieceKind)}
            aria-label={`${player} hand ${pieceKind}`}
          >
            <span>{PIECE_LABELS[pieceKind]}</span>
            <span className="hand-count">x{hand[pieceKind]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
