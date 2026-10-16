import { pieceLabel } from './pieceLabels';
import type { Piece as GamePiece } from '../game/types';

type PieceProps = {
  piece: GamePiece;
};

export function Piece({ piece }: PieceProps) {
  return (
    <span className="piece" data-owner={piece.owner}>
      {pieceLabel(piece)}
    </span>
  );
}
