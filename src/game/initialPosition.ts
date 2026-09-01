import type { Board, GameState, Piece, Square } from './types';

const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array<Piece | null>(9).fill(null));

const toIndex = (square: Square) => ({
  row: square.rank - 1,
  col: 9 - square.file,
});

const place = (board: Board, square: Square, piece: Piece) => {
  const { row, col } = toIndex(square);
  board[row][col] = piece;
};

export const getPieceAt = (board: Board, square: Square): Piece | null => {
  const { row, col } = toIndex(square);
  return board[row]?.[col] ?? null;
};

export const createInitialGameState = (): GameState => {
  const board = emptyBoard();

  const backRank = [
    'lance',
    'knight',
    'silver',
    'gold',
    'king',
    'gold',
    'silver',
    'knight',
    'lance',
  ] as const;

  backRank.forEach((kind, index) => {
    place(board, { file: 9 - index, rank: 9 }, { owner: 'sente', kind });
    place(board, { file: 9 - index, rank: 1 }, { owner: 'gote', kind });
  });

  place(board, { file: 8, rank: 8 }, { owner: 'sente', kind: 'bishop' });
  place(board, { file: 2, rank: 8 }, { owner: 'sente', kind: 'rook' });
  place(board, { file: 2, rank: 2 }, { owner: 'gote', kind: 'bishop' });
  place(board, { file: 8, rank: 2 }, { owner: 'gote', kind: 'rook' });

  for (let file = 1; file <= 9; file += 1) {
    place(board, { file, rank: 7 }, { owner: 'sente', kind: 'pawn' });
    place(board, { file, rank: 3 }, { owner: 'gote', kind: 'pawn' });
  }

  return {
    board,
    hands: { sente: {}, gote: {} },
    currentPlayer: 'sente',
    history: [],
    status: { type: 'playing' },
  };
};
