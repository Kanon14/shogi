import { Piece } from './Piece';
import type { Piece as GamePiece, Square as GameSquare } from '../game/types';

type SquareProps = {
  square: GameSquare;
  piece: GamePiece | null;
  isSelected: boolean;
  isLegalDestination: boolean;
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
  onClick,
}: SquareProps) {
  return (
    <button
      type="button"
      className="square"
      role="gridcell"
      aria-label={squareLabel(square, piece)}
      aria-selected={isSelected}
      data-legal={isLegalDestination}
      data-selected={isSelected}
      onClick={() => onClick(square)}
    >
      {piece ? <Piece piece={piece} /> : null}
    </button>
  );
}
