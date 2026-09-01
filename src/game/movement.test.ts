import { describe, expect, it } from 'vitest';
import {
  canPromote,
  forwardFor,
  isInsideBoard,
  isPromotionZone,
  mustPromote,
} from './movement';

describe('movement helpers', () => {
  it('detects board bounds', () => {
    expect(isInsideBoard({ file: 1, rank: 1 })).toBe(true);
    expect(isInsideBoard({ file: 9, rank: 9 })).toBe(true);
    expect(isInsideBoard({ file: 0, rank: 5 })).toBe(false);
    expect(isInsideBoard({ file: 5, rank: 10 })).toBe(false);
  });

  it('uses opposite forward directions for sente and gote', () => {
    expect(forwardFor('sente')).toBe(-1);
    expect(forwardFor('gote')).toBe(1);
  });

  it('detects promotion zones', () => {
    expect(isPromotionZone('sente', 3)).toBe(true);
    expect(isPromotionZone('sente', 4)).toBe(false);
    expect(isPromotionZone('gote', 7)).toBe(true);
    expect(isPromotionZone('gote', 6)).toBe(false);
  });

  it('detects promotable and mandatory promotion pieces', () => {
    expect(canPromote('rook')).toBe(true);
    expect(canPromote('gold')).toBe(false);
    expect(canPromote('tokin')).toBe(false);
    expect(mustPromote('pawn', 'sente', { file: 5, rank: 1 })).toBe(true);
    expect(mustPromote('lance', 'gote', { file: 5, rank: 9 })).toBe(true);
    expect(mustPromote('knight', 'sente', { file: 5, rank: 2 })).toBe(true);
    expect(mustPromote('silver', 'sente', { file: 5, rank: 1 })).toBe(false);
  });
});
