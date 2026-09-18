import { Piece } from './Piece';
import type { Piece as GamePiece, Square as GameSquare } from '../game/types';

type SquareProps = {
  square: GameSquare;
  piece: GamePiece | null;
  isSelected: boolean;
  isLegalDestination: boolean;
  lastMovePart: 'origin' | 'destination' | null;
  isInCheck: boolean;
  onClick: (square: GameSquare) => void;
};

const squareLabel = (square: GameSquare, piece: GamePiece | null) => {
  const location = `${square.file}-${square.rank}`;
  if (!piece) return `empty square ${location}`;
  return `${piece.owner} ${piece.kind} on ${location}`;
};

export function Square({
  square,
  piece,
  isSelected,
  isLegalDestination,
  lastMovePart,
  isInCheck,
  onClick,
}: SquareProps) {
  const descriptionId = `square-${square.file}-${square.rank}-description`;
  const descriptions = [
    lastMovePart === 'origin' ? 'Last move origin' : null,
    lastMovePart === 'destination' ? 'Last move destination' : null,
    isInCheck ? 'King in check' : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      className="square"
      role="gridcell"
      aria-label={squareLabel(square, piece)}
      aria-describedby={descriptions.length > 0 ? descriptionId : undefined}
      aria-selected={isSelected}
      data-legal={isLegalDestination}
      data-selected={isSelected}
      data-last-move={lastMovePart ?? undefined}
      data-in-check={isInCheck || undefined}
      onClick={() => onClick(square)}
    >
      {piece ? <Piece piece={piece} /> : null}
      {descriptions.length > 0 ? <span id={descriptionId} className="sr-only">{descriptions.join('. ')}</span> : null}
    </button>
  );
}
