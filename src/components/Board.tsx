import { Square } from './Square';
import type { Board as GameBoard, Square as GameSquare } from '../game/types';

type BoardProps = {
  board: GameBoard;
  selectedSquare: GameSquare | null;
  legalDestinations: GameSquare[];
  lastMoveOrigin: GameSquare | null;
  lastMoveDestination: GameSquare | null;
  checkedKingSquare: GameSquare | null;
  onSquareClick: (square: GameSquare) => void;
};

const sameSquare = (a: GameSquare | null, b: GameSquare) =>
  Boolean(a && a.file === b.file && a.rank === b.rank);

const includesSquare = (squares: GameSquare[], square: GameSquare) =>
  squares.some((candidate) => candidate.file === square.file && candidate.rank === square.rank);

export function Board({
  board,
  selectedSquare,
  legalDestinations,
  lastMoveOrigin,
  lastMoveDestination,
  checkedKingSquare,
  onSquareClick,
}: BoardProps) {
  const squares: GameSquare[] = [];

  for (let rank = 1; rank <= 9; rank += 1) {
    for (let file = 9; file >= 1; file -= 1) {
      squares.push({ file, rank });
    }
  }

  return (
    <div className="board" role="grid" aria-label="Shogi board">
      {squares.map((square) => (
        <Square
          key={`${square.file}-${square.rank}`}
          square={square}
          piece={board[square.rank - 1][9 - square.file]}
          isSelected={sameSquare(selectedSquare, square)}
          isLegalDestination={includesSquare(legalDestinations, square)}
          lastMovePart={
            sameSquare(lastMoveOrigin, square)
              ? 'origin'
              : sameSquare(lastMoveDestination, square)
                ? 'destination'
                : null
          }
          isInCheck={sameSquare(checkedKingSquare, square)}
          onClick={onSquareClick}
        />
      ))}
    </div>
  );
}
