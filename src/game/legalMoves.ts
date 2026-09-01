import {
  canPromote,
  forwardFor,
  isInsideBoard,
  isPromotionZone,
  mustPromote,
} from './movement';
import type { AnyPieceKind, Board, BoardMove, GameState, Piece, Player, Square } from './types';
import type { DropMove, PieceKind } from './types';

type Step = {
  file: number;
  rank: number;
};

const GOLD_LIKE: AnyPieceKind[] = ['gold', 'promotedSilver', 'promotedKnight', 'promotedLance', 'tokin'];

const ORTHOGONAL: Step[] = [
  { file: 0, rank: -1 },
  { file: 1, rank: 0 },
  { file: 0, rank: 1 },
  { file: -1, rank: 0 },
];

const DIAGONAL: Step[] = [
  { file: 1, rank: -1 },
  { file: 1, rank: 1 },
  { file: -1, rank: 1 },
  { file: -1, rank: -1 },
];

const toIndex = (square: Square) => ({
  row: square.rank - 1,
  col: 9 - square.file,
});

const getPieceAt = (board: Board, square: Square): Piece | null => {
  const { row, col } = toIndex(square);
  return board[row]?.[col] ?? null;
};

const setPieceAt = (board: Board, square: Square, piece: Piece | null) => {
  const { row, col } = toIndex(square);
  board[row][col] = piece;
};

const cloneBoard = (board: Board): Board =>
  board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));

const opponentOf = (player: Player): Player => (player === 'sente' ? 'gote' : 'sente');

const scaleForPlayer = (steps: Step[], player: Player): Step[] => {
  const forward = forwardFor(player);
  return steps.map((step) => ({ file: step.file, rank: step.rank * -forward }));
};

const stepMovesFor = (kind: AnyPieceKind, player: Player): Step[] => {
  if (GOLD_LIKE.includes(kind)) {
    return scaleForPlayer(
      [
        { file: 0, rank: -1 },
        { file: 1, rank: -1 },
        { file: -1, rank: -1 },
        { file: 1, rank: 0 },
        { file: -1, rank: 0 },
        { file: 0, rank: 1 },
      ],
      player,
    );
  }

  if (kind === 'king') return [...ORTHOGONAL, ...DIAGONAL];
  if (kind === 'silver') {
    return scaleForPlayer(
      [
        { file: 0, rank: -1 },
        { file: 1, rank: -1 },
        { file: -1, rank: -1 },
        { file: 1, rank: 1 },
        { file: -1, rank: 1 },
      ],
      player,
    );
  }
  if (kind === 'knight') {
    return scaleForPlayer(
      [
        { file: 1, rank: -2 },
        { file: -1, rank: -2 },
      ],
      player,
    );
  }
  if (kind === 'pawn') return [{ file: 0, rank: forwardFor(player) }];
  if (kind === 'dragon') return DIAGONAL;
  if (kind === 'horse') return ORTHOGONAL;
  return [];
};

const slidingDirectionsFor = (kind: AnyPieceKind, player: Player): Step[] => {
  if (kind === 'rook' || kind === 'dragon') return ORTHOGONAL;
  if (kind === 'bishop' || kind === 'horse') return DIAGONAL;
  if (kind === 'lance') return [{ file: 0, rank: forwardFor(player) }];
  return [];
};

const addPromotionChoices = (piece: Piece, from: Square, to: Square): BoardMove[] => {
  const baseMove: BoardMove = { type: 'move', from, to, promote: false };
  if (!canPromote(piece.kind)) return [baseMove];

  const canPromoteByZone =
    isPromotionZone(piece.owner, from.rank) || isPromotionZone(piece.owner, to.rank);

  if (!canPromoteByZone) return [baseMove];
  if (mustPromote(piece.kind, piece.owner, to)) return [{ ...baseMove, promote: true }];
  return [baseMove, { ...baseMove, promote: true }];
};

const canOccupy = (state: GameState, player: Player, square: Square) => {
  const occupant = getPieceAt(state.board, square);
  return !occupant || occupant.owner !== player;
};

const generateStepMoves = (state: GameState, piece: Piece, from: Square): BoardMove[] =>
  stepMovesFor(piece.kind, piece.owner)
    .map((step) => ({ file: from.file + step.file, rank: from.rank + step.rank }))
    .filter((to) => isInsideBoard(to) && canOccupy(state, piece.owner, to))
    .flatMap((to) => addPromotionChoices(piece, from, to));

const generateSlidingMoves = (state: GameState, piece: Piece, from: Square): BoardMove[] => {
  const moves: BoardMove[] = [];

  slidingDirectionsFor(piece.kind, piece.owner).forEach((direction) => {
    let to = { file: from.file + direction.file, rank: from.rank + direction.rank };

    while (isInsideBoard(to)) {
      const occupant = getPieceAt(state.board, to);
      if (occupant?.owner === piece.owner) break;

      moves.push(...addPromotionChoices(piece, from, to));
      if (occupant) break;

      to = { file: to.file + direction.file, rank: to.rank + direction.rank };
    }
  });

  return moves;
};

const promoteKind = (kind: AnyPieceKind): AnyPieceKind => {
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

const applyBoardMoveForSearch = (state: GameState, move: BoardMove): GameState => {
  const board = cloneBoard(state.board);
  const piece = getPieceAt(board, move.from);
  if (!piece) return state;

  setPieceAt(board, move.from, null);
  setPieceAt(board, move.to, {
    ...piece,
    kind: move.promote ? promoteKind(piece.kind) : piece.kind,
  });

  return { ...state, board };
};

const attacksSquare = (state: GameState, from: Square, target: Square): boolean =>
  getPseudoLegalBoardMoves(state, from).some(
    (move) => move.to.file === target.file && move.to.rank === target.rank,
  );

export const getPseudoLegalBoardMoves = (state: GameState, from: Square): BoardMove[] => {
  const piece = getPieceAt(state.board, from);
  if (!piece || piece.owner !== state.currentPlayer) return [];

  return [
    ...generateStepMoves(state, piece, from),
    ...generateSlidingMoves(state, piece, from),
  ];
};

export const isInCheck = (state: GameState, player: Player): boolean => {
  let kingSquare: Square | null = null;

  for (let rank = 1; rank <= 9; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const piece = getPieceAt(state.board, { file, rank });
      if (piece?.owner === player && piece.kind === 'king') {
        kingSquare = { file, rank };
      }
    }
  }

  if (!kingSquare) return false;

  const attackingPlayer = opponentOf(player);
  const attackState = { ...state, currentPlayer: attackingPlayer };

  for (let rank = 1; rank <= 9; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const piece = getPieceAt(attackState.board, { file, rank });
      if (piece?.owner === attackingPlayer && attacksSquare(attackState, { file, rank }, kingSquare)) {
        return true;
      }
    }
  }

  return false;
};

export const getLegalBoardMoves = (state: GameState, from: Square): BoardMove[] =>
  getPseudoLegalBoardMoves(state, from).filter((move) => {
    const next = applyBoardMoveForSearch(state, move);
    return !isInCheck(next, state.currentPlayer);
  });

const cloneHands = (hands: GameState['hands']): GameState['hands'] => ({
  sente: { ...hands.sente },
  gote: { ...hands.gote },
});

const removeFromHandForSearch = (hand: GameState['hands'][Player], kind: PieceKind) => {
  const current = hand[kind] ?? 0;
  if (current <= 1) {
    const next = { ...hand };
    delete next[kind];
    return next;
  }

  return { ...hand, [kind]: current - 1 };
};

const applyDropForSearch = (state: GameState, move: DropMove): GameState => {
  const board = cloneBoard(state.board);
  const hands = cloneHands(state.hands);

  setPieceAt(board, move.to, { owner: state.currentPlayer, kind: move.pieceKind });
  hands[state.currentPlayer] = removeFromHandForSearch(hands[state.currentPlayer], move.pieceKind);

  return { ...state, board, hands };
};

const isDeadZoneDrop = (kind: PieceKind, player: Player, to: Square) => {
  if (kind === 'pawn' || kind === 'lance') {
    return player === 'sente' ? to.rank === 1 : to.rank === 9;
  }

  if (kind === 'knight') {
    return player === 'sente' ? to.rank <= 2 : to.rank >= 8;
  }

  return false;
};

const fileHasUnpromotedPawn = (state: GameState, player: Player, file: number) => {
  for (let rank = 1; rank <= 9; rank += 1) {
    const piece = getPieceAt(state.board, { file, rank });
    if (piece?.owner === player && piece.kind === 'pawn') return true;
  }

  return false;
};

const getLegalDropMovesInternal = (
  state: GameState,
  pieceKind: PieceKind,
  rejectPawnDropMate: boolean,
): DropMove[] => {
  const count = state.hands[state.currentPlayer][pieceKind] ?? 0;
  if (count <= 0) return [];

  const candidates: DropMove[] = [];

  for (let rank = 1; rank <= 9; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const to = { file, rank };
      if (getPieceAt(state.board, to)) continue;
      if (isDeadZoneDrop(pieceKind, state.currentPlayer, to)) continue;
      if (pieceKind === 'pawn' && fileHasUnpromotedPawn(state, state.currentPlayer, file)) continue;

      const move: DropMove = { type: 'drop', pieceKind, to };
      const next = applyDropForSearch(state, move);
      if (isInCheck(next, state.currentPlayer)) continue;

      if (
        rejectPawnDropMate &&
        pieceKind === 'pawn' &&
        isCheckmateInternal(next, opponentOf(state.currentPlayer), false)
      ) {
        continue;
      }

      candidates.push(move);
    }
  }

  return candidates;
};

export const getLegalDropMoves = (state: GameState, pieceKind: PieceKind): DropMove[] =>
  getLegalDropMovesInternal(state, pieceKind, true);

const isCheckmateInternal = (
  state: GameState,
  player: Player,
  rejectPawnDropMate: boolean,
): boolean => {
  if (!isInCheck(state, player)) return false;

  const searchState = { ...state, currentPlayer: player };

  for (let rank = 1; rank <= 9; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const piece = getPieceAt(searchState.board, { file, rank });
      if (piece?.owner === player && getLegalBoardMoves(searchState, { file, rank }).length > 0) {
        return false;
      }
    }
  }

  return Object.entries(searchState.hands[player]).every(([kind, count]) => {
    if (!count) return true;
    return getLegalDropMovesInternal(searchState, kind as PieceKind, rejectPawnDropMate).length === 0;
  });
};

export const isCheckmate = (state: GameState, player: Player): boolean =>
  isCheckmateInternal(state, player, true);
