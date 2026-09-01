import type { GameMove, GameState } from './types';

export const formatMove = (state: GameState, move: GameMove): string => {
  if (move.type === 'drop') {
    return `${state.currentPlayer} drops ${move.pieceKind} to ${move.to.file}${move.to.rank}`;
  }

  const piece = state.board[move.from.rank - 1][9 - move.from.file];
  const pieceName = piece?.kind ?? 'piece';
  const suffix = move.promote ? '+' : '';
  return `${state.currentPlayer} ${pieceName}${suffix} ${move.from.file}${move.from.rank}-${move.to.file}${move.to.rank}`;
};
