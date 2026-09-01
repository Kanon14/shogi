import { useMemo, useState } from 'react';
import { Board } from './Board';
import { GameStatus } from './GameStatus';
import { Hand } from './Hand';
import { MoveHistory } from './MoveHistory';
import { PromotionDialog } from './PromotionDialog';
import { createInitialGameState } from '../game/initialPosition';
import { getLegalBoardMoves, getLegalDropMoves } from '../game/legalMoves';
import { applyMove } from '../game/state';
import type { BoardMove, DropMove, GameState, PieceKind, Square } from '../game/types';

type Selection =
  | { type: 'board'; square: Square; legalMoves: BoardMove[] }
  | { type: 'hand'; pieceKind: PieceKind; legalMoves: DropMove[] };

const sameSquare = (a: Square, b: Square) => a.file === b.file && a.rank === b.rank;

const pieceAt = (state: GameState, square: Square) => state.board[square.rank - 1][9 - square.file];

const uniqueDestinations = (moves: Array<BoardMove | DropMove>) =>
  moves.reduce<Square[]>((destinations, move) => {
    if (!destinations.some((square) => sameSquare(square, move.to))) destinations.push(move.to);
    return destinations;
  }, []);

type GameShellProps = {
  initialState?: GameState;
};

export function GameShell({ initialState }: GameShellProps) {
  const [gameState, setGameState] = useState(() => initialState ?? createInitialGameState());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<BoardMove | null>(null);

  const isGameOver = gameState.status.type === 'checkmate';

  const legalDestinations = useMemo(
    () => (selection ? uniqueDestinations(selection.legalMoves) : []),
    [selection],
  );

  const resetGame = () => {
    setGameState(createInitialGameState());
    setSelection(null);
    setPendingPromotion(null);
  };

  const applyBoardMove = (move: BoardMove) => {
    setGameState((state) => applyMove(state, move));
    setSelection(null);
    setPendingPromotion(null);
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || pendingPromotion) return;

    if (selection?.type === 'board') {
      const movesToSquare = selection.legalMoves.filter((move) => sameSquare(move.to, square));
      if (movesToSquare.length === 1) {
        applyBoardMove(movesToSquare[0]);
        return;
      }

      if (movesToSquare.length > 1) {
        setPendingPromotion(movesToSquare.find((move) => move.promote) ?? movesToSquare[0]);
        return;
      }
    }

    if (selection?.type === 'hand') {
      const dropMove = selection.legalMoves.find((move) => sameSquare(move.to, square));
      if (dropMove) {
        setGameState((state) => applyMove(state, dropMove));
        setSelection(null);
        return;
      }
    }

    const piece = pieceAt(gameState, square);
    if (piece?.owner === gameState.currentPlayer) {
      setSelection({ type: 'board', square, legalMoves: getLegalBoardMoves(gameState, square) });
      return;
    }

    setSelection(null);
  };

  const handleHandPieceClick = (pieceKind: PieceKind) => {
    if (isGameOver || pendingPromotion) return;
    setSelection({ type: 'hand', pieceKind, legalMoves: getLegalDropMoves(gameState, pieceKind) });
  };

  const choosePromotion = (promote: boolean) => {
    if (!selection || selection.type !== 'board' || !pendingPromotion) return;
    const chosenMove = selection.legalMoves.find(
      (move) => sameSquare(move.to, pendingPromotion.to) && move.promote === promote,
    );
    if (chosenMove) applyBoardMove(chosenMove);
  };

  const selectedSquare = selection?.type === 'board' ? selection.square : null;
  const selectedHandPiece = selection?.type === 'hand' ? selection.pieceKind : null;

  return (
    <main className="game-shell">
      <aside className="side-panel">
        <GameStatus currentPlayer={gameState.currentPlayer} status={gameState.status} onReset={resetGame} />
        <Hand
          player="gote"
          hand={gameState.hands.gote}
          activePiece={gameState.currentPlayer === 'gote' ? selectedHandPiece : null}
          disabled={gameState.currentPlayer !== 'gote' || isGameOver}
          onPieceClick={handleHandPieceClick}
        />
      </aside>

      <section className="board-panel" aria-label="Game board">
        <Board
          board={gameState.board}
          selectedSquare={selectedSquare}
          legalDestinations={legalDestinations}
          onSquareClick={handleSquareClick}
        />
      </section>

      <aside className="side-panel">
        <Hand
          player="sente"
          hand={gameState.hands.sente}
          activePiece={gameState.currentPlayer === 'sente' ? selectedHandPiece : null}
          disabled={gameState.currentPlayer !== 'sente' || isGameOver}
          onPieceClick={handleHandPieceClick}
        />
        <MoveHistory history={gameState.history} />
      </aside>

      <PromotionDialog move={pendingPromotion} onChoose={choosePromotion} />
    </main>
  );
}
