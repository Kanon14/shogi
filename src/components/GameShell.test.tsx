import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
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
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('saves the current game after a move', async () => {
    const user = userEvent.setup();
    render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));

    await waitFor(() => {
      expect(localStorage.getItem('shogi.gameState.v1')).toContain('"currentPlayer":"gote"');
    });
  });

  it('restores a saved game after remounting', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));
    await waitFor(() => {
      expect(localStorage.getItem('shogi.gameState.v1')).not.toBeNull();
    });

    unmount();
    render(<GameShell />);

    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();
    expect(screen.getByText(/gote to move/i)).toBeInTheDocument();
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

  it('clears the saved game when starting a new game', async () => {
    const user = userEvent.setup();
    render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));
    await waitFor(() => {
      expect(localStorage.getItem('shogi.gameState.v1')).not.toBeNull();
    });

    await user.click(screen.getByRole('button', { name: /new game/i }));

    await waitFor(() => {
      expect(localStorage.getItem('shogi.gameState.v1')).toBeNull();
    });
  });

  it('moves backward and forward through move history', async () => {
    const user = userEvent.setup();
    render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));
    await user.click(screen.getByLabelText('gote pawn on 3-3'));
    await user.click(screen.getByLabelText('empty square 3-4'));

    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();
    expect(screen.getByLabelText('gote pawn on 3-4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous move' }));

    expect(screen.getByText('Viewing move 1 of 2')).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();
    expect(screen.getByLabelText('gote pawn on 3-3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous move' }));

    expect(screen.getByText('Viewing start position')).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-7')).toBeInTheDocument();
    expect(screen.getByLabelText('gote pawn on 3-3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next move' }));

    expect(screen.getByText('Viewing move 1 of 2')).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next move' }));

    expect(screen.getByText('Viewing latest position')).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();
    expect(screen.getByLabelText('gote pawn on 3-4')).toBeInTheDocument();
  });

  it('ignores board input while reviewing move history', async () => {
    const user = userEvent.setup();
    render(<GameShell />);

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));
    await user.click(screen.getByRole('button', { name: 'Previous move' }));

    await user.click(screen.getByLabelText('sente pawn on 7-7'));
    await user.click(screen.getByLabelText('empty square 7-6'));

    expect(screen.getByText('Viewing start position')).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next move' }));

    expect(screen.getByText('Viewing latest position')).toBeInTheDocument();
    expect(screen.getByLabelText('sente pawn on 7-6')).toBeInTheDocument();
    expect(screen.getByText(/gote to move/i)).toBeInTheDocument();
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

  it('focuses promote when optional promotion is offered', async () => {
    const user = userEvent.setup();
    render(<GameShell initialState={optionalPromotionState()} />);

    await user.click(screen.getByLabelText('sente silver on 5-4'));
    await user.click(screen.getByLabelText('empty square 5-3'));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Promote' })).toHaveFocus());
  });

  it('keeps keyboard focus inside the promotion choices', async () => {
    const user = userEvent.setup();
    render(<GameShell initialState={optionalPromotionState()} />);

    await user.click(screen.getByLabelText('sente silver on 5-4'));
    await user.click(screen.getByLabelText('empty square 5-3'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Promote' })).toHaveFocus());

    await user.tab();
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Promote' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus();
  });

  it('declines optional promotion with Escape', async () => {
    const user = userEvent.setup();
    render(<GameShell initialState={optionalPromotionState()} />);

    await user.click(screen.getByLabelText('sente silver on 5-4'));
    await user.click(screen.getByLabelText('empty square 5-3'));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Promotion choice' })).not.toBeInTheDocument();
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
