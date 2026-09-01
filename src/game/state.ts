import { isCheckmate, isInCheck } from './legalMoves';
import { formatMove } from './notation';
import type {
  AnyPieceKind,
  Board,
  GameMove,
  GameState,
  Hand,
  Hands,
  PieceKind,
  Player,
} from './types';

export const promote = (kind: AnyPieceKind): AnyPieceKind => {
  const promotions: Partial<Record<AnyPieceKind, AnyPieceKind>> = {
    rook: 'dragon',
    bishop: 'horse',
    silver: 'promotedSilver',
    knight: 'promotedKnight',
    lance: 'promotedLance',
    pawn: 'tokin',
  };

  return promotions[kind] ?? kind;
};

export const demote = (kind: AnyPieceKind): PieceKind => {
  const demotions: Partial<Record<AnyPieceKind, PieceKind>> = {
    dragon: 'rook',
    horse: 'bishop',
    promotedSilver: 'silver',
    promotedKnight: 'knight',
    promotedLance: 'lance',
    tokin: 'pawn',
  };

  return (demotions[kind] ?? kind) as PieceKind;
};

const opponentOf = (player: Player): Player => (player === 'sente' ? 'gote' : 'sente');

const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));

const cloneHands = (hands: Hands): Hands => ({
  sente: { ...hands.sente },
  gote: { ...hands.gote },
});

const addToHand = (hand: Hand, kind: PieceKind): Hand => ({
  ...hand,
  [kind]: (hand[kind] ?? 0) + 1,
});

const removeFromHand = (hand: Hand, kind: PieceKind): Hand => {
  const current = hand[kind] ?? 0;
  if (current <= 1) {
    const next = { ...hand };
    delete next[kind];
    return next;
  }

  return { ...hand, [kind]: current - 1 };
};

const statusAfterMove = (state: GameState, nextPlayer: Player): GameState['status'] => {
  const mover = opponentOf(nextPlayer);
  if (isCheckmate(state, nextPlayer)) {
    return { type: 'checkmate', winner: mover, loser: nextPlayer };
  }

  if (isInCheck(state, nextPlayer)) {
    return { type: 'check', checkedPlayer: nextPlayer };
  }

  return { type: 'playing' };
};

export const applyMove = (state: GameState, move: GameMove): GameState => {
  const board = cloneBoard(state.board);
  const hands = cloneHands(state.hands);
  const nextPlayer = opponentOf(state.currentPlayer);
  const label = formatMove(state, move);

  if (move.type === 'move') {
    const fromRow = move.from.rank - 1;
    const fromCol = 9 - move.from.file;
    const toRow = move.to.rank - 1;
    const toCol = 9 - move.to.file;
    const piece = board[fromRow][fromCol];
    if (!piece) throw new Error('Cannot move from an empty square.');

    const captured = board[toRow][toCol];
    if (captured) {
      hands[state.currentPlayer] = addToHand(hands[state.currentPlayer], demote(captured.kind));
    }

    board[fromRow][fromCol] = null;
    board[toRow][toCol] = {
      ...piece,
      kind: move.promote ? promote(piece.kind) : piece.kind,
    };
  } else {
    const toRow = move.to.rank - 1;
    const toCol = 9 - move.to.file;
    if (board[toRow][toCol]) throw new Error('Cannot drop onto an occupied square.');
    if ((hands[state.currentPlayer][move.pieceKind] ?? 0) <= 0) {
      throw new Error('Cannot drop a piece that is not in hand.');
    }

    hands[state.currentPlayer] = removeFromHand(hands[state.currentPlayer], move.pieceKind);
    board[toRow][toCol] = { owner: state.currentPlayer, kind: move.pieceKind };
  }

  const nextState: GameState = {
    ...state,
    board,
    hands,
    currentPlayer: nextPlayer,
    history: [
      ...state.history,
      { id: state.history.length + 1, player: state.currentPlayer, label },
    ],
  };

  return {
    ...nextState,
    status: statusAfterMove(nextState, nextPlayer),
  };
};
