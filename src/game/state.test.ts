import { describe, expect, it } from 'vitest';
import { getPieceAt } from './initialPosition';
import { applyMove, demote, promote } from './state';
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

describe('promotion helpers', () => {
  it('promotes and demotes shogi pieces', () => {
    expect(promote('pawn')).toBe('tokin');
    expect(promote('bishop')).toBe('horse');
    expect(promote('gold')).toBe('gold');
    expect(demote('tokin')).toBe('pawn');
    expect(demote('dragon')).toBe('rook');
    expect(demote('gold')).toBe('gold');
  });
});

describe('applyMove', () => {
  it('moves a board piece, switches turn, and records history', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 7, 7, { owner: 'sente', kind: 'pawn' });
    const state = stateWithBoard(board);

    const next = applyMove(state, {
      type: 'move',
      from: { file: 7, rank: 7 },
      to: { file: 7, rank: 6 },
      promote: false,
    });

    expect(getPieceAt(next.board, { file: 7, rank: 7 })).toBeNull();
    expect(getPieceAt(next.board, { file: 7, rank: 6 })).toMatchObject({ owner: 'sente', kind: 'pawn' });
    expect(next.currentPlayer).toBe('gote');
    expect(next.history[0]).toMatchObject({ id: 1, player: 'sente' });
    expect(next.history[0].label).toContain('sente pawn 77-76');
  });

  it('captures, demotes the captured piece, and adds it to the mover hand', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 7, 2, { owner: 'sente', kind: 'gold' });
    place(board, 7, 1, { owner: 'gote', kind: 'tokin' });
    const state = stateWithBoard(board);

    const next = applyMove(state, {
      type: 'move',
      from: { file: 7, rank: 2 },
      to: { file: 7, rank: 1 },
      promote: false,
    });

    expect(getPieceAt(next.board, { file: 7, rank: 1 })).toMatchObject({ owner: 'sente', kind: 'gold' });
    expect(next.hands.sente.pawn).toBe(1);
  });

  it('applies promotion when requested', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 4, 2, { owner: 'sente', kind: 'silver' });
    const state = stateWithBoard(board);

    const next = applyMove(state, {
      type: 'move',
      from: { file: 4, rank: 2 },
      to: { file: 5, rank: 1 },
      promote: true,
    });

    expect(getPieceAt(next.board, { file: 5, rank: 1 })).toMatchObject({
      owner: 'sente',
      kind: 'promotedSilver',
    });
  });

  it('drops a hand piece and decrements the hand count', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    const state = stateWithBoard(board, { hands: { sente: { pawn: 2 }, gote: {} } });

    const next = applyMove(state, {
      type: 'drop',
      pieceKind: 'pawn',
      to: { file: 4, rank: 5 },
    });

    expect(getPieceAt(next.board, { file: 4, rank: 5 })).toMatchObject({ owner: 'sente', kind: 'pawn' });
    expect(next.hands.sente.pawn).toBe(1);
    expect(next.currentPlayer).toBe('gote');
  });

  it('rejects board moves that are not legal for the current position', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    place(board, 7, 7, { owner: 'sente', kind: 'pawn' });
    const state = stateWithBoard(board);

    expect(() =>
      applyMove(state, {
        type: 'move',
        from: { file: 7, rank: 7 },
        to: { file: 7, rank: 5 },
        promote: false,
      }),
    ).toThrow('Illegal board move.');
  });

  it('rejects drops that are not legal for the current position', () => {
    const board = emptyBoard();
    place(board, 5, 9, { owner: 'sente', kind: 'king' });
    place(board, 5, 1, { owner: 'gote', kind: 'king' });
    const state = stateWithBoard(board, { hands: { sente: { pawn: 1 }, gote: {} } });

    expect(() =>
      applyMove(state, {
        type: 'drop',
        pieceKind: 'pawn',
        to: { file: 4, rank: 1 },
      }),
    ).toThrow('Illegal drop move.');
  });
});
