export type Player = 'sente' | 'gote';

export type PieceKind =
  | 'king'
  | 'rook'
  | 'bishop'
  | 'gold'
  | 'silver'
  | 'knight'
  | 'lance'
  | 'pawn';

export type PromotedPieceKind =
  | 'dragon'
  | 'horse'
  | 'promotedSilver'
  | 'promotedKnight'
  | 'promotedLance'
  | 'tokin';

export type AnyPieceKind = PieceKind | PromotedPieceKind;

export type Square = {
  file: number;
  rank: number;
};

export type Piece = {
  owner: Player;
  kind: AnyPieceKind;
};

export type Board = Array<Array<Piece | null>>;

export type Hand = Partial<Record<PieceKind, number>>;

export type Hands = Record<Player, Hand>;

export type GameStatus =
  | { type: 'playing' }
  | { type: 'check'; checkedPlayer: Player }
  | { type: 'checkmate'; winner: Player; loser: Player };

export type MoveHistoryEntry = {
  id: number;
  player: Player;
  label: string;
};

export type GameState = {
  board: Board;
  hands: Hands;
  currentPlayer: Player;
  history: MoveHistoryEntry[];
  status: GameStatus;
};

export type BoardMove = {
  type: 'move';
  from: Square;
  to: Square;
  promote: boolean;
};

export type DropMove = {
  type: 'drop';
  pieceKind: PieceKind;
  to: Square;
};

export type GameMove = BoardMove | DropMove;
