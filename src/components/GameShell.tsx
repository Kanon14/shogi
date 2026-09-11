import { useEffect, useMemo, useState } from 'react';
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

const SAVED_GAME_STATE_KEY = 'shogi.gameState.v1';

type SavedGameRecord = {
  activeState: GameState;
  positionHistory: GameState[];
};

const createSavedGameRecord = (state: GameState): SavedGameRecord => ({
  activeState: state,
  positionHistory: [state],
});

const loadSavedGameState = () => {
  try {
    const savedState = localStorage.getItem(SAVED_GAME_STATE_KEY);
    if (!savedState) return null;

    const parsedState = JSON.parse(savedState) as GameState | SavedGameRecord;
    if ('activeState' in parsedState && 'positionHistory' in parsedState) return parsedState;

    return createSavedGameRecord(parsedState);
  } catch {
    localStorage.removeItem(SAVED_GAME_STATE_KEY);
    return null;
  }
};

const saveGameState = (activeState: GameState, positionHistory: GameState[]) => {
  try {
    if (activeState.history.length === 0) {
      localStorage.removeItem(SAVED_GAME_STATE_KEY);
      return;
    }

    localStorage.setItem(SAVED_GAME_STATE_KEY, JSON.stringify({ activeState, positionHistory }));
  } catch {
    // A storage failure should not block local play.
  }
};

const uniqueDestinations = (moves: Array<BoardMove | DropMove>) =>
  moves.reduce<Square[]>((destinations, move) => {
    if (!destinations.some((square) => sameSquare(square, move.to))) destinations.push(move.to);
    return destinations;
  }, []);

type GameShellProps = {
  initialState?: GameState;
};

export function GameShell({ initialState }: GameShellProps) {
  const [initialRecord] = useState(() =>
    initialState ? createSavedGameRecord(initialState) : (loadSavedGameState() ?? createSavedGameRecord(createInitialGameState())),
  );
  const [gameState, setGameState] = useState(initialRecord.activeState);
  const [positionHistory, setPositionHistory] = useState(initialRecord.positionHistory);
  const [reviewIndex, setReviewIndex] = useState(initialRecord.positionHistory.length - 1);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<BoardMove | null>(null);

  const displayedState = positionHistory[reviewIndex] ?? gameState;
  const latestIndex = positionHistory.length - 1;
  const isReviewingHistory = reviewIndex !== latestIndex;
  const isGameOver = gameState.status.type === 'checkmate';

  const legalDestinations = useMemo(
    () => (selection ? uniqueDestinations(selection.legalMoves) : []),
    [selection],
  );

  useEffect(() => {
    if (!initialState) saveGameState(gameState, positionHistory);
  }, [gameState, positionHistory, initialState]);

  const resetGame = () => {
    const nextState = createInitialGameState();
    setGameState(nextState);
    setPositionHistory([nextState]);
    setReviewIndex(0);
    setSelection(null);
    setPendingPromotion(null);
  };

  const commitMove = (move: BoardMove | DropMove) => {
    setGameState((state) => {
      const nextState = applyMove(state, move);
      setPositionHistory((history) => [...history, nextState]);
      setReviewIndex((index) => index + 1);
      return nextState;
    });
  };

  const applyBoardMove = (move: BoardMove) => {
    commitMove(move);
    setSelection(null);
    setPendingPromotion(null);
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || isReviewingHistory || pendingPromotion) return;

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
        commitMove(dropMove);
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
    if (isGameOver || isReviewingHistory || pendingPromotion) return;
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
        <GameStatus currentPlayer={displayedState.currentPlayer} status={displayedState.status} onReset={resetGame} />
        <Hand
          player="gote"
          hand={displayedState.hands.gote}
          activePiece={gameState.currentPlayer === 'gote' ? selectedHandPiece : null}
          disabled={gameState.currentPlayer !== 'gote' || isGameOver || isReviewingHistory}
          onPieceClick={handleHandPieceClick}
        />
      </aside>

      <section className="board-panel" aria-label="Game board">
        <Board
          board={displayedState.board}
          selectedSquare={isReviewingHistory ? null : selectedSquare}
          legalDestinations={isReviewingHistory ? [] : legalDestinations}
          onSquareClick={handleSquareClick}
        />
      </section>

      <aside className="side-panel">
        <Hand
          player="sente"
          hand={displayedState.hands.sente}
          activePiece={gameState.currentPlayer === 'sente' ? selectedHandPiece : null}
          disabled={gameState.currentPlayer !== 'sente' || isGameOver || isReviewingHistory}
          onPieceClick={handleHandPieceClick}
        />
        <MoveHistory
          history={gameState.history}
          reviewIndex={reviewIndex}
          latestIndex={latestIndex}
          onPrevious={() => {
            setSelection(null);
            setReviewIndex((index) => Math.max(0, index - 1));
          }}
          onNext={() => {
            setSelection(null);
            setReviewIndex((index) => Math.min(latestIndex, index + 1));
          }}
          onLatest={() => {
            setSelection(null);
            setReviewIndex(latestIndex);
          }}
        />
      </aside>

      <PromotionDialog move={pendingPromotion} onChoose={choosePromotion} />
    </main>
  );
}
