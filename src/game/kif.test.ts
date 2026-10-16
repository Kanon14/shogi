import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './initialPosition';
import { formatKifRecord } from './kif';
import { applyMove } from './state';
import type { Board, GameState, Piece } from './types';

const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array<Piece | null>(9).fill(null));

const place = (board: Board, file: number, rank: number, piece: Piece) => {
  board[rank - 1][9 - file] = piece;
};

const stateWithBoard = (board: Board, hands: GameState['hands'] = { sente: {}, gote: {} }): GameState => ({
  board,
  hands,
  currentPlayer: 'sente',
  history: [],
  status: { type: 'playing' },
});

describe('KIF record formatting', () => {
  it('formats numbered opening moves with KIF coordinates', () => {
    const initial = createInitialGameState();
    const afterSente = applyMove(initial, {
      type: 'move',
      from: { file: 7, rank: 7 },
      to: { file: 7, rank: 6 },
      promote: false,
    });
    const afterGote = applyMove(afterSente, {
      type: 'move',
      from: { file: 3, rank: 3 },
      to: { file: 3, rank: 4 },
      promote: false,
    });

    expect(formatKifRecord([initial, afterSente, afterGote])).toContain('1 ７六歩(77)\n2 ３四歩(33)');
  });

  it('formats piece drops, captures, and promotion', () => {
    const dropBoard = emptyBoard();
    place(dropBoard, 5, 9, { owner: 'sente', kind: 'king' });
    place(dropBoard, 5, 1, { owner: 'gote', kind: 'king' });
    const dropStart = stateWithBoard(dropBoard, { sente: { pawn: 1 }, gote: {} });
    const afterDrop = applyMove(dropStart, { type: 'drop', pieceKind: 'pawn', to: { file: 5, rank: 5 } });

    const promotionBoard = emptyBoard();
    place(promotionBoard, 5, 9, { owner: 'sente', kind: 'king' });
    place(promotionBoard, 1, 1, { owner: 'gote', kind: 'king' });
    place(promotionBoard, 4, 2, { owner: 'sente', kind: 'silver' });
    const promotionStart = stateWithBoard(promotionBoard);
    const afterPromotion = applyMove(promotionStart, {
      type: 'move',
      from: { file: 4, rank: 2 },
      to: { file: 5, rank: 1 },
      promote: true,
    });

    const captureBoard = emptyBoard();
    place(captureBoard, 5, 9, { owner: 'sente', kind: 'king' });
    place(captureBoard, 1, 1, { owner: 'gote', kind: 'king' });
    place(captureBoard, 7, 2, { owner: 'sente', kind: 'gold' });
    place(captureBoard, 7, 1, { owner: 'gote', kind: 'pawn' });
    const captureStart = stateWithBoard(captureBoard);
    const afterCapture = applyMove(captureStart, {
      type: 'move',
      from: { file: 7, rank: 2 },
      to: { file: 7, rank: 1 },
      promote: false,
    });

    expect(formatKifRecord([dropStart, afterDrop])).toContain('1 ５五歩打');
    expect(formatKifRecord([promotionStart, afterPromotion])).toContain('1 ５一銀成(42)');
    expect(formatKifRecord([captureStart, afterCapture])).toContain('1 ７一金(72)');
  });

  it('writes the checkmate result', () => {
    const initial = createInitialGameState();
    const afterMove = applyMove(initial, {
      type: 'move',
      from: { file: 7, rank: 7 },
      to: { file: 7, rank: 6 },
      promote: false,
    });
    const checkmate = { ...afterMove, status: { type: 'checkmate', winner: 'sente', loser: 'gote' } as const };

    expect(formatKifRecord([initial, checkmate])).toContain('まで1手で先手の勝ち');
  });
});
