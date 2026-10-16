import type { AnyPieceKind, Piece, PieceKind } from '../game/types';

export const PIECE_LABELS: Record<AnyPieceKind, string> = {
  king: '王',
  rook: '飛',
  bishop: '角',
  gold: '金',
  silver: '銀',
  knight: '桂',
  lance: '香',
  pawn: '歩',
  dragon: '龍',
  horse: '馬',
  promotedSilver: '成銀',
  promotedKnight: '成桂',
  promotedLance: '成香',
  tokin: 'と',
};

export const HAND_PIECES: PieceKind[] = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];

export const pieceLabel = (piece: Piece) =>
  piece.kind === 'king' && piece.owner === 'gote' ? '玉' : PIECE_LABELS[piece.kind];
