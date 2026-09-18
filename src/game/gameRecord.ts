import type { AnyPieceKind, GameState, PieceKind, Player } from './types';

export type SavedGameRecord = {
  activeState: GameState;
  positionHistory: GameState[];
};

type GameRecordFile = SavedGameRecord & {
  version: 1;
};

const players = new Set<Player>(['sente', 'gote']);
const pieceKinds = new Set<AnyPieceKind>([
  'king',
  'rook',
  'bishop',
  'gold',
  'silver',
  'knight',
  'lance',
  'pawn',
  'dragon',
  'horse',
  'promotedSilver',
  'promotedKnight',
  'promotedLance',
  'tokin',
]);
const handKinds = new Set<PieceKind>(['king', 'rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPlayer = (value: unknown): value is Player => typeof value === 'string' && players.has(value as Player);

const isPiece = (value: unknown) =>
  value === null ||
  (isRecord(value) && isPlayer(value.owner) && typeof value.kind === 'string' && pieceKinds.has(value.kind as AnyPieceKind));

const isBoard = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 9 &&
  value.every((row) => Array.isArray(row) && row.length === 9 && row.every(isPiece));

const isHand = (value: unknown) =>
  isRecord(value) &&
  Object.entries(value).every(
    ([kind, count]) => handKinds.has(kind as PieceKind) && Number.isInteger(count) && (count as number) >= 0,
  );

const isHands = (value: unknown) =>
  isRecord(value) && isHand(value.sente) && isHand(value.gote);

const isHistory = (value: unknown) =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      isRecord(entry) &&
      Number.isInteger(entry.id) &&
      isPlayer(entry.player) &&
      typeof entry.label === 'string',
  );

const isStatus = (value: unknown) => {
  if (!isRecord(value)) return false;
  if (value.type === 'playing') return true;
  if (value.type === 'check') return isPlayer(value.checkedPlayer);
  return value.type === 'checkmate' && isPlayer(value.winner) && isPlayer(value.loser) && value.winner !== value.loser;
};

const isGameState = (value: unknown): value is GameState =>
  isRecord(value) &&
  isBoard(value.board) &&
  isHands(value.hands) &&
  isPlayer(value.currentPlayer) &&
  isHistory(value.history) &&
  isStatus(value.status);

const isSameValue = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => isSameValue(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && isSameValue(left[key], right[key]))
  );
};

export const serializeGameRecord = (record: SavedGameRecord) =>
  JSON.stringify({ version: 1, ...record } satisfies GameRecordFile, null, 2);

export const parseGameRecord = (source: string): SavedGameRecord => {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error('Invalid game record');
  }

  if (!isRecord(value)) throw new Error('Invalid game record');
  if (value.version !== 1) throw new Error('Unsupported game record version');
  if (!isGameState(value.activeState)) throw new Error('Invalid game record');
  if (!Array.isArray(value.positionHistory) || value.positionHistory.length === 0 || !value.positionHistory.every(isGameState)) {
    throw new Error('Invalid game record');
  }
  if (!isSameValue(value.activeState, value.positionHistory.at(-1))) throw new Error('Invalid game record');

  return { activeState: value.activeState, positionHistory: value.positionHistory };
};
