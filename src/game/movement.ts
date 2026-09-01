import type { AnyPieceKind, Player, Square } from './types';

const PROMOTABLE_KINDS: AnyPieceKind[] = [
  'rook',
  'bishop',
  'silver',
  'knight',
  'lance',
  'pawn',
];

export const isInsideBoard = (square: Square) =>
  square.file >= 1 && square.file <= 9 && square.rank >= 1 && square.rank <= 9;

export const forwardFor = (player: Player) => (player === 'sente' ? -1 : 1);

export const isPromotionZone = (player: Player, rank: number) =>
  player === 'sente' ? rank <= 3 : rank >= 7;

export const canPromote = (kind: AnyPieceKind) => PROMOTABLE_KINDS.includes(kind);

export const mustPromote = (kind: AnyPieceKind, player: Player, to: Square) => {
  if (kind === 'pawn' || kind === 'lance') {
    return player === 'sente' ? to.rank === 1 : to.rank === 9;
  }

  if (kind === 'knight') {
    return player === 'sente' ? to.rank <= 2 : to.rank >= 8;
  }

  return false;
};
