import type { GameState, Piece, Square } from './types';

const fullWidthFiles = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
const ranks = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const pieceNames: Record<Piece['kind'], string> = {
  king: '玉',
  rook: '飛',
  bishop: '角',
  gold: '金',
  silver: '銀',
  knight: '桂',
  lance: '香',
  pawn: '歩',
  dragon: '龍',
  horse: '馬',
  promotedSilver: '成銀',
  promotedKnight: '成桂',
  promotedLance: '成香',
  tokin: 'と',
};

const pieceAt = (state: GameState, square: Square) => state.board[square.rank - 1][9 - square.file];

const samePiece = (left: Piece | null, right: Piece | null) =>
  left?.owner === right?.owner && left?.kind === right?.kind;

const sameSquare = (left: Square | null, right: Square) =>
  Boolean(left && left.file === right.file && left.rank === right.rank);

type MoveDescription = {
  destination: Square;
  notation: string;
};

const describeMove = (before: GameState, after: GameState, previousDestination: Square | null): MoveDescription | null => {
  let origin: Square | null = null;
  let destination: Square | null = null;
  let movedPiece: Piece | null = null;

  for (let rank = 1; rank <= 9; rank += 1) {
    for (let file = 1; file <= 9; file += 1) {
      const square = { file, rank };
      const beforePiece = pieceAt(before, square);
      const afterPiece = pieceAt(after, square);
      if (samePiece(beforePiece, afterPiece)) continue;

      if (beforePiece?.owner === before.currentPlayer && !afterPiece) {
        origin = square;
        movedPiece = beforePiece;
      }
      if (afterPiece?.owner === before.currentPlayer) destination = square;
    }
  }

  if (!destination) return null;
  const destinationPiece = pieceAt(after, destination);
  const piece = movedPiece ?? destinationPiece;
  if (!piece) return null;

  const destinationText = sameSquare(previousDestination, destination)
    ? '同'
    : `${fullWidthFiles[destination.file]}${ranks[destination.rank]}`;
  const promoted = Boolean(origin && movedPiece && destinationPiece && movedPiece.kind !== destinationPiece.kind);
  const sourceText = origin ? `(${origin.file}${origin.rank})` : '打';

  return {
    destination,
    notation: `${destinationText}${pieceNames[piece.kind]}${promoted ? '成' : ''}${sourceText}`,
  };
};

const gameResult = (state: GameState, moveCount: number) => {
  if (state.status.type !== 'checkmate') return null;
  return `まで${moveCount}手で${state.status.winner === 'sente' ? '先手' : '後手'}の勝ち`;
};

export const formatKifRecord = (positionHistory: GameState[]) => {
  const lines = [
    '#KIF version=2.0 encoding=UTF-8',
    '手合割：平手',
    '先手：Sente',
    '後手：Gote',
    '手数----指手---------消費時間--',
  ];
  let previousDestination: Square | null = null;

  for (let index = 1; index < positionHistory.length; index += 1) {
    const move = describeMove(positionHistory[index - 1], positionHistory[index], previousDestination);
    if (!move) continue;
    lines.push(`${index} ${move.notation}`);
    previousDestination = move.destination;
  }

  const result = positionHistory.at(-1) ? gameResult(positionHistory.at(-1)!, positionHistory.length - 1) : null;
  if (result) lines.push(result);

  return `${lines.join('\n')}\n`;
};
