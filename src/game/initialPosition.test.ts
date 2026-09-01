import { describe, expect, it } from 'vitest';
import { createInitialGameState, getPieceAt } from './initialPosition';

describe('createInitialGameState', () => {
  it('creates a 9x9 board with sente to move', () => {
    const state = createInitialGameState();

    expect(state.board).toHaveLength(9);
    expect(state.board.every((row) => row.length === 9)).toBe(true);
    expect(state.currentPlayer).toBe('sente');
  });

  it('places kings and pawns in standard starting squares', () => {
    const state = createInitialGameState();

    expect(getPieceAt(state.board, { file: 5, rank: 9 })).toMatchObject({
      owner: 'sente',
      kind: 'king',
    });
    expect(getPieceAt(state.board, { file: 5, rank: 1 })).toMatchObject({
      owner: 'gote',
      kind: 'king',
    });
    expect(getPieceAt(state.board, { file: 1, rank: 7 })).toMatchObject({
      owner: 'sente',
      kind: 'pawn',
    });
    expect(getPieceAt(state.board, { file: 9, rank: 3 })).toMatchObject({
      owner: 'gote',
      kind: 'pawn',
    });
  });

  it('starts with empty hands and no move history', () => {
    const state = createInitialGameState();

    expect(state.hands.sente).toEqual({});
    expect(state.hands.gote).toEqual({});
    expect(state.history).toEqual([]);
    expect(state.status).toEqual({ type: 'playing' });
  });
});
