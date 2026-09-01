import { RotateCcw } from 'lucide-react';
import type { GameStatus as Status, Player } from '../game/types';

type GameStatusProps = {
  currentPlayer: Player;
  status: Status;
  onReset: () => void;
};

const statusText = (currentPlayer: Player, status: Status) => {
  if (status.type === 'checkmate') return `${status.winner} wins by checkmate`;
  if (status.type === 'check') return `${status.checkedPlayer} is in check`;
  return `${currentPlayer} to move`;
};

export function GameStatus({ currentPlayer, status, onReset }: GameStatusProps) {
  return (
    <section className="game-status" aria-label="Game status">
      <h1>Shogi</h1>
      <p>{statusText(currentPlayer, status)}</p>
      <button type="button" className="reset-button" onClick={onReset}>
        <RotateCcw aria-hidden="true" size={18} />
        New game
      </button>
    </section>
  );
}
