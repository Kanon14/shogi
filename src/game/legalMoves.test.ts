import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './initialPosition';
import {
  getLegalBoardMoves,
  getPseudoLegalBoardMoves,
  isInCheck,
} from './legalMoves';
import type { Board, GameState, Piece } from './types';

const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array<Piece | null>(9).fill(null));

const stateWithBoard = (board: Board, currentPlayer: GameState['currentPlayer'] = 'sente'): GameState => ({
  board,
  hands: { sente: {}, gote: {} },
  currentPlayer,
  history: [],
  status: { type: 'playing' },
});

const place = (board: Board, file: number, rank: number, piece: Piece) => {
  board[rank - 1][9 - file] = piece;
};

describe('getPseudoLegalBoardMoves', () => {
  it('generates a forward pawn move from the initial position', () => {
    const state = createInitialGameState();

    expect(getPseudoLegalBoardMoves(state, { file: 7, rank: 7 }).map((move) => move.to)).toContainEqual({
      file: 7,
      rank: 6,
    });
  });

  it('stops sliding pieces at blockers and allows capturing the first enemy blocker', () => {
    const board = emptyBoard();
    place(board, 5, 5, { owner: 'sente', kind: 'rook' });
    place(board, 5, 3, { owner: 'sente', kind: 'pawn' });
    place(board, 7, 5, { owner: 'gote', kind: 'silver' });
    place(board, 8, 5, { owner: 'gote', kind: 'gold' });
    const state = stateWithBoard(board);

    const destinations = getPseudoLegalBoardMoves(state, { file: 5, rank: 5 }).map((move) => move.to);

    expect(destinations).toContainEqual({ file: 5, rank: 4 });
    expect(destinations).not.toContainEqual({ file: 5, rank: 3 });
    expect(destinations).toContainEqual({ file: 7, rank: 5 });
    expect(destinations).not.toContainEqual({ file: 8, rank: 5 });
  });

  it('adds promotion and non-promotion choices for optional promotion moves', () => {
    const board = emptyBoard();
    place(board, 5, 4, { owner: 'sente', kind: 'silver' });
    const state = stateWithBoard(board);

    const moves = getPseudoLegalBoardMoves(state, { file: 5, rank: 4 }).filter(
      (move) => move.to.file === 5 && move.to.rank === 3,
    );

    expect(moves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ promote: false }),
        expect.objectContaining({ promote: true }),
      ]),
    );
  });

  it('only generates promoting moves when promotion is mandatory', () => {
    const board = emptyBoard();
    place(board, 5, 2, { owner: 'sente', kind: 'pawn' });
    const state = stateWithBoard(board);

    expect(getPseudoLegalBoardMoves(state, { file: 5, rank: 2 })).toEqual([
      { type: 'move', from: { file: 5, rank: 2 }, to: { file: 5, rank: 1 }, promote: true },
    ]);
  });

  it('moves dragon as a rook plus one-step diagonals', () => {
    const board = emptyBoard();
    place(board, 5, 5, { owner: 'sente', kind: 'dragon' });
    const state = stateWithBoard(board);
    const destinations = getPseudoLegalBoardMoves(state, { file: 5, rank: 5 }).map((move) => move.to);

    expect(destinations).toContainEqual({ file: 5, rank: 1 });
    expect(destinations).toContainEqual({ file: 9, rank: 5 });
    expect(destinations).toContainEqual({ file: 6, rank: 4 });
    expect(destinations).not.toContainEqual({ file: 7, rank: 3 });
  });

  it('moves horse as a bishop plus one-step orthogonals', () => {
    const board = emptyBoard();
    place(board, 5, 5, { owner: 'sente', kind: 'horse' });
    const state = stateWithBoard(board);
    const destinations = getPseudoLegalBoardMoves(state, { file: 5, rank: 5 }).map((move) => move.to);

    expect(destinations).toContainEqual({ file: 9, rank: 1 });
    expect(destinations).toContainEqual({ file: 1, rank: 9 });
    expect(destinations).toContainEqual({ file: 5, rank: 4 });
    expect(destinations).not.toContainEqual({ file: 5, rank: 3 });
  });
});

describe('isInCheck and getLegalBoardMoves', () => {
  it('detects check from a sliding piece', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 5, 5, { owner: 'gote', kind: 'rook' });
    const state = stateWithBoard(board);

    expect(isInCheck(state, 'sente')).toBe(true);
  });

  it('filters moves that would expose the current player king to check', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 5, 5, { owner: 'gote', kind: 'rook' });
    place(board, 5, 7, { owner: 'sente', kind: 'gold' });
    const state = stateWithBoard(board);

    expect(getLegalBoardMoves(state, { file: 5, rank: 7 }).every((move) => move.to.file === 5)).toBe(true);
  });

  it('allows a pinned defender to block along the checking line', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 5, 5, { owner: 'gote', kind: 'rook' });
    place(board, 4, 7, { owner: 'sente', kind: 'gold' });
    const state = stateWithBoard(board);

    expect(getLegalBoardMoves(state, { file: 4, rank: 7 })).toContainEqual({
      type: 'move',
      from: { file: 4, rank: 7 },
      to: { file: 5, rank: 7 },
      promote: false,
    });
  });

  it('rejects king moves adjacent to the opposing king', () => {
    const board = emptyBoard();
    place(board, 5, 5, { owner: 'sente', kind: 'king' });
    place(board, 5, 3, { owner: 'gote', kind: 'king' });
    const state = stateWithBoard(board);

    expect(getLegalBoardMoves(state, { file: 5, rank: 5 })).not.toContainEqual({
      type: 'move',
      from: { file: 5, rank: 5 },
      to: { file: 5, rank: 4 },
      promote: false,
    });
  });
});
