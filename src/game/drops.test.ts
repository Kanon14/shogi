import { describe, expect, it } from 'vitest';
import { getLegalDropMoves, isCheckmate } from './legalMoves';
import type { Board, GameState, Piece } from './types';

const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array<Piece | null>(9).fill(null));

const place = (board: Board, file: number, rank: number, piece: Piece) => {
  board[rank - 1][9 - file] = piece;
};

const stateWithBoard = (
  board: Board,
  overrides: Partial<Pick<GameState, 'currentPlayer' | 'hands' | 'history' | 'status'>> = {},
): GameState => ({
  board,
  hands: { sente: {}, gote: {} },
  currentPlayer: 'sente',
  history: [],
  status: { type: 'playing' },
  ...overrides,
});

describe('getLegalDropMoves', () => {
  it('generates drops for empty squares when a piece is in hand', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    const state = stateWithBoard(board, { hands: { sente: { gold: 1 }, gote: {} } });

    expect(getLegalDropMoves(state, 'gold')).toContainEqual({
      type: 'drop',
      pieceKind: 'gold',
      to: { file: 4, rank: 5 },
    });
  });

  it('rejects pawn drops on a file with an existing unpromoted pawn', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 4, 7, { owner: 'sente', kind: 'pawn' });
    const state = stateWithBoard(board, { hands: { sente: { pawn: 1 }, gote: {} } });

    expect(getLegalDropMoves(state, 'pawn').some((move) => move.to.file === 4)).toBe(false);
  });

  it('allows pawn drops on a file with only a promoted pawn', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 4, 7, { owner: 'sente', kind: 'tokin' });
    const state = stateWithBoard(board, { hands: { sente: { pawn: 1 }, gote: {} } });

    expect(getLegalDropMoves(state, 'pawn').some((move) => move.to.file === 4)).toBe(true);
  });

  it('rejects dead-zone pawn, lance, and knight drops', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    const state = stateWithBoard(board, {
      hands: { sente: { pawn: 1, lance: 1, knight: 1 }, gote: {} },
    });

    expect(getLegalDropMoves(state, 'pawn').every((move) => move.to.rank > 1)).toBe(true);
    expect(getLegalDropMoves(state, 'lance').every((move) => move.to.rank > 1)).toBe(true);
    expect(getLegalDropMoves(state, 'knight').every((move) => move.to.rank > 2)).toBe(true);
  });

  it('rejects drops that leave the mover king in check', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 5, 5, { owner: 'gote', kind: 'rook' });
    const state = stateWithBoard(board, { hands: { sente: { gold: 1 }, gote: {} } });

    expect(getLegalDropMoves(state, 'gold').every((move) => move.to.file === 5)).toBe(true);
  });

  it('rejects pawn-drop checkmate', () => {
    const board = emptyBoard();
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 3, { owner: 'sente', kind: 'rook' });
    place(board, 4, 1, { owner: 'sente', kind: 'gold' });
    place(board, 6, 1, { owner: 'sente', kind: 'gold' });
    place(board, 4, 2, { owner: 'sente', kind: 'gold' });
    place(board, 6, 2, { owner: 'sente', kind: 'gold' });
    const state = stateWithBoard(board, { hands: { sente: { pawn: 1 }, gote: {} } });

    expect(getLegalDropMoves(state, 'pawn')).not.toContainEqual({
      type: 'drop',
      pieceKind: 'pawn',
      to: { file: 5, rank: 2 },
    });
  });
});

describe('isCheckmate', () => {
  it('detects a surrounded king in checkmate', () => {
    const board = emptyBoard();
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 2, { owner: 'sente', kind: 'gold' });
    place(board, 4, 1, { owner: 'sente', kind: 'gold' });
    place(board, 6, 1, { owner: 'sente', kind: 'gold' });
    place(board, 4, 2, { owner: 'sente', kind: 'gold' });
    place(board, 6, 2, { owner: 'sente', kind: 'gold' });
    const state = stateWithBoard(board);

    expect(isCheckmate(state, 'gote')).toBe(true);
  });
});
