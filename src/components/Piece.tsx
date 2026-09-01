import { PIECE_LABELS } from './pieceLabels';
import type { Piece as GamePiece } from '../game/types';

type PieceProps = {
  piece: GamePiece;
};

export function Piece({ piece }: PieceProps) {
  return (
    <span className="piece" data-owner={piece.owner}>
      {PIECE_LABELS[piece.kind]}
    </span>
  );
}
