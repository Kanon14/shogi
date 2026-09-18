import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './initialPosition';
import { parseGameRecord, serializeGameRecord } from './gameRecord';
import { applyMove } from './state';

describe('game records', () => {
  it('round-trips a versioned game record', () => {
    const state = createInitialGameState();
    const record = { activeState: state, positionHistory: [state] };

    expect(parseGameRecord(serializeGameRecord(record))).toEqual(record);
  });

  it('rejects a record with an invalid board', () => {
    const state = createInitialGameState();
    const invalidRecord = JSON.stringify({
      version: 1,
      activeState: { ...state, board: [] },
      positionHistory: [state],
    });

    expect(() => parseGameRecord(invalidRecord)).toThrow('Invalid game record');
  });

  it('rejects an unsupported record version', () => {
    const state = createInitialGameState();
    const invalidRecord = JSON.stringify({
      version: 2,
      activeState: state,
      positionHistory: [state],
    });

    expect(() => parseGameRecord(invalidRecord)).toThrow('Unsupported game record version');
  });

  it('rejects a record whose active state differs from its latest snapshot', () => {
    const initialState = createInitialGameState();
    const movedState = applyMove(initialState, {
      type: 'move',
      from: { file: 7, rank: 7 },
      to: { file: 7, rank: 6 },
      promote: false,
    });
    const inconsistentRecord = JSON.stringify({
      version: 1,
      activeState: movedState,
      positionHistory: [initialState],
    });

    expect(() => parseGameRecord(inconsistentRecord)).toThrow('Invalid game record');
  });
});
