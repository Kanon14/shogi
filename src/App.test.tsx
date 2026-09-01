import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the playable shogi shell', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Shogi' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
  });
});
