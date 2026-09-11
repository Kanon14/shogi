import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GameShell } from './GameShell';
import type { Board, GameState, Piece } from '../game/types';

const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array<Piece | null>(9).fill(null));

const place = (board: Board, file: number, rank: number, piece: Piece) => {
  board[rank - 1][9 - file] = piece;
};

const checkmateState = (): GameState => {
  const board = emptyBoard();
  place(board, 5, 1, { owner: 'gote', kind: 'king' });
  place(board, 5, 9, { owner: 'sente', kind: 'king' });
  place(board, 7, 7, { owner: 'sente', kind: 'pawn' });

  return {
    board,
    hands: { sente: {}, gote: {} },
    currentPlayer: 'sente',
    history: [],
    status: { type: 'checkmate', winner: 'sente', loser: 'gote' },
  };
};

const stateWithSenteHandGold = (): GameState => {
  const board = emptyBoard();
  place(board, 5, 1, { owner: 'gote', kind: 'king' });
  place(board, 5, 9, { owner: 'sente', kind: 'king' });

  return {
    board,
    hands: { sente: { gold: 1 }, gote: {} },
    currentPlayer: 'sente',
    history: [],
    status: { type: 'playing' },
  };
};

const optionalPromotionState = (): GameState => {
  const board = emptyBoard();
  place(board, 5, 1, { owner: 'gote', kind: 'king' });
  place(board, 5, 9, { owner: 'sente', kind: 'king' });
  place(board, 5, 4, { owner: 'sente', kind: 'silver' });

  return {
    board,
    hands: { sente: {}, gote: {} },
    currentPlayer: 'sente',
    history: [],
    status: { type: 'playing' },
  };
};

describe('GameShell', () => {
  it('renders a 9x9 board and current turn', () => {
    render(<GameShell />);

    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
    expect(screen.getByText(/sente to move/i)).toBeInTheDocument();
  });

  it('moves a sente pawn and switches turn', async () => {
    const user = userEvent.setup();
    render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));

    expect(screen.getByText(/gote to move/i)).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();
  });

  it('resets the game after a move', async () => {
    const user = userEvent.setup();
    render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));
    await user.click(screen.getByRole('button', { name: /new game/i }));

    expect(screen.getByText(/sente to move/i)).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-7')).toBeInTheDocument();
  });

  it('drops a piece from hand onto the board', async () => {
    const user = userEvent.setup();
    render(<GameShell initialState={stateWithSenteHandGold()} />);

    await user.click(screen.getByLabelText('sente hand gold'));
    await user.click(screen.getByLabelText('empty square 4-5'));

    expect(screen.getByLabelText('sente gold on 4-5')).toBeInTheDocument();
    expect(screen.getByText(/gote to move/i)).toBeInTheDocument();
  });

  it('lets the player decline optional promotion', async () => {
    const user = userEvent.setup();
    render(<GameShell initialState={optionalPromotionState()} />);

    await user.click(screen.getByLabelText('sente silver on 5-4'));
    await user.click(screen.getByLabelText('empty square 5-3'));
    await user.click(screen.getByRole('button', { name: 'Keep' }));

    expect(screen.getByLabelText('sente silver on 5-3')).toBeInTheDocument();
    expect(screen.getByText(/gote to move/i)).toBeInTheDocument();
  });

  it('shows checkmate status', () => {
    render(<GameShell initialState={checkmateState()} />);

    expect(screen.getByText('sente wins by checkmate')).toBeInTheDocument();
  });

  it('does not apply board clicks after checkmate', async () => {
    const user = userEvent.setup();
    render(<GameShell initialState={checkmateState()} />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));

    expect(screen.getByLabelText('sente pawn on 7-7')).toBeInTheDocument();
    expect(screen.getByText('sente wins by checkmate')).toBeInTheDocument();
  });
});
