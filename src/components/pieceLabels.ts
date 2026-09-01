import type { AnyPieceKind, PieceKind } from '../game/types';

export const PIECE_LABELS: Record<AnyPieceKind, string> = {
  king: 'K',
  rook: 'R',
  bishop: 'B',
  gold: 'G',
  silver: 'S',
  knight: 'N',
  lance: 'L',
  pawn: 'P',
  dragon: '+R',
  horse: '+B',
  promotedSilver: '+S',
  promotedKnight: '+N',
  promotedLance: '+L',
  tokin: '+P',
};

export const HAND_PIECES: PieceKind[] = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];
