import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hand } from './Hand';
import { Piece } from './Piece';

describe('Piece', () => {
  it('renders Japanese labels for standard and promoted pieces', () => {
    const { rerender } = render(<Piece piece={{ owner: 'sente', kind: 'rook' }} />);
    expect(screen.getByText('飛')).toBeInTheDocument();

    rerender(<Piece piece={{ owner: 'sente', kind: 'promotedSilver' }} />);
    expect(screen.getByText('成銀')).toBeInTheDocument();
  });

  it('uses the traditional king character for each player', () => {
    const { rerender } = render(<Piece piece={{ owner: 'sente', kind: 'king' }} />);
    expect(screen.getByText('王')).toBeInTheDocument();

    rerender(<Piece piece={{ owner: 'gote', kind: 'king' }} />);
    expect(screen.getByText('玉')).toBeInTheDocument();
  });

  it('renders Japanese labels for captured pieces', () => {
    render(
      <Hand
        player="sente"
        hand={{ bishop: 1, pawn: 2 }}
        activePiece={null}
        disabled={false}
        onPieceClick={() => undefined}
      />,
    );

    expect(screen.getByText('角')).toBeInTheDocument();
    expect(screen.getByText('歩')).toBeInTheDocument();
  });
});
