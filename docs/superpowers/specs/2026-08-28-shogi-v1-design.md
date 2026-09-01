# Shogi V1 Design

## Goal

Build a local two-player shogi game that runs in the browser. The first version should be playable on one computer and should establish a reliable rules engine that later milestones can reuse for AI, tutorials, puzzles, or online play.

## Non-Goals

- No online multiplayer.
- No computer opponent.
- No account system or persistence.
- No puzzle/training mode.
- No custom variants.

## Target Experience

The app opens directly into a playable shogi board. Two local players take turns from the same screen. A player can select a piece, see legal destinations, move, capture, promote when allowed, drop captured pieces from hand, and reset the game.

The UI should prioritize clarity over decoration:

- 9x9 board with stable square sizing.
- Player hands shown near the board.
- Current turn indicator.
- Legal move highlights.
- Promotion prompt when a move can promote.
- Move history panel.
- Clear status for check, win, or invalid attempted actions.

## Technology

- Vite for development and build tooling.
- React for UI.
- TypeScript for game state and rule safety.
- Vitest for unit tests.
- CSS modules or plain CSS for styling.

This stack keeps the first version lightweight while giving enough structure to test shogi rules independently from the UI.

## Architecture

### `src/game`

Pure TypeScript game logic. This layer must not import React.

Responsibilities:

- Represent board coordinates, pieces, players, hands, and game state.
- Create the standard starting position.
- Generate pseudo-legal piece movement.
- Filter legal moves that would leave the current player in check.
- Apply board moves and drops.
- Handle captures into hand.
- Handle promotion and demotion on capture.
- Detect check and checkmate.
- Produce move history entries for the UI.

Expected modules:

- `types.ts`: shared domain types.
- `initialPosition.ts`: standard setup.
- `movement.ts`: piece movement and promotion zone rules.
- `legalMoves.ts`: legal move and drop generation.
- `state.ts`: game state transitions.
- `notation.ts`: simple readable move labels for history.

### `src/components`

React UI components.

Expected components:

- `GameShell`: main page layout and state owner.
- `Board`: 9x9 grid renderer.
- `Square`: individual board square.
- `Piece`: visual piece marker.
- `Hand`: captured pieces available for drops.
- `PromotionDialog`: required or optional promotion choice.
- `MoveHistory`: chronological move list.
- `GameStatus`: turn, check, checkmate, and reset controls.

### `src/styles`

Shared styling for board layout, responsive behavior, controls, and theme tokens.

## Game Rules Scope

V1 should implement standard shogi rules:

- Players: sente and gote.
- Pieces: king, rook, bishop, gold, silver, knight, lance, pawn.
- Promoted pieces: promoted rook, promoted bishop, promoted silver, promoted knight, promoted lance, promoted pawn.
- Standard 9x9 initial position.
- Standard movement for all pieces.
- Captures move opponent pieces into the capturing player's hand.
- Captured promoted pieces are demoted before entering hand.
- Drops place a hand piece onto an empty square.
- Pawns, lances, and knights cannot be dropped where they would have no legal future move.
- Pawns cannot be dropped onto a file that already contains an unpromoted pawn owned by the dropping player.
- Pawn-drop checkmate is illegal.
- Promotion is available when a piece moves into, out of, or within the opponent promotion zone.
- Promotion is mandatory when an unpromoted pawn, lance, or knight would otherwise have no legal future move.
- A move or drop is illegal if it leaves the mover's king in check.
- Checkmate ends the game.

## Interaction Model

Board move:

1. Player selects one of their board pieces.
2. Legal destinations are highlighted.
3. Player selects a highlighted square.
4. If promotion is mandatory, the move promotes immediately.
5. If promotion is optional, the promotion dialog asks promote or keep.
6. Game state updates, turn switches, and history records the move.

Drop move:

1. Player selects a piece from their hand.
2. Legal drop squares are highlighted.
3. Player selects a highlighted empty square.
4. Game state updates, turn switches, and history records the drop.

Invalid clicks should clear selection or show a restrained inline status. They should not throw runtime errors or leave partial state.

## Testing Strategy

Unit tests should cover the rules engine before relying on UI behavior:

- Initial board setup.
- Movement for each piece type and promoted piece type.
- Capture and hand conversion.
- Promotion optional and mandatory cases.
- Basic legal drops.
- Illegal pawn file drops.
- Illegal dead-zone drops for pawn, lance, and knight.
- Self-check prevention.
- Check detection.
- Checkmate detection.
- Pawn-drop mate rejection.

UI tests can be minimal for V1:

- App renders.
- Starting board appears.
- Selecting a piece highlights legal moves.
- A simple legal move updates the turn.

## Milestone Breakdown

### Milestone 1: Project Scaffold

Create the Vite React TypeScript app, install Vitest, add basic scripts, and render a placeholder game shell.

Acceptance:

- `npm run dev` starts the app.
- `npm run build` succeeds.
- `npm test` runs.

### Milestone 2: Core Types and Initial Position

Define domain types and standard starting board.

Acceptance:

- Tests verify the 9x9 board, piece counts, ownership, and starting squares.

### Milestone 3: Movement and Legal Moves

Implement movement generation and legal move filtering.

Acceptance:

- Tests cover all pieces and self-check prevention.

### Milestone 4: Captures, Hands, Drops, and Promotion

Implement state transitions for captures, drops, and promotion.

Acceptance:

- Tests cover captures into hand, demotion on capture, legal drops, illegal drops, and promotion rules.

### Milestone 5: Playable UI

Connect the rules engine to a browser UI.

Acceptance:

- Local two-player game can be played by clicking pieces, moving, dropping, promoting, and resetting.

### Milestone 6: Endgame and Polish

Add check/checkmate status, move history polish, responsive layout, and basic visual QA.

Acceptance:

- Check and checkmate are displayed correctly.
- Move history remains readable.
- Board is usable on desktop and mobile widths.

## Risks and Decisions

- Shogi drop rules are easy to get subtly wrong. Tests should be written close to the rules code.
- Checkmate and pawn-drop mate are more complex than basic movement. If they threaten V1 momentum, check detection can ship first and mate can become V1.1, but the preferred V1 target includes both.
- The UI should use simple text-based Japanese piece labels first. Custom art can wait until the rules are reliable.
- No external shogi engine dependency is planned for V1 because the core goal is learning and owning the rules. If implementation proves too slow, this decision can be revisited.

## Open Implementation Choices

- Piece labels can use Japanese kanji, English abbreviations, or both. Default recommendation: kanji with small English tooltips or accessible labels.
- Move history notation can start as readable plain text rather than formal shogi notation.
- State can live in React for V1. A dedicated state library is unnecessary until the app grows beyond local play.
