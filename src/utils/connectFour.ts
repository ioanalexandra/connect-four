export const ROWS = 6;
export const COLS = 7;

export type Board = number[][];

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function dropPiece(
  board: Board,
  column: number,
  player: 1 | 2,
): { board: Board; row: number } | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === 0) {
      const next = board.map(r => [...r]);
      next[row][column] = player;
      return { board: next, row };
    }
  }
  return null;
}

export function checkWin(board: Board, player: number): boolean {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0, 1, 2, 3].every(i => board[r][c + i] === player)) return true;

  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c < COLS; c++)
      if ([0, 1, 2, 3].every(i => board[r + i][c] === player)) return true;

  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0, 1, 2, 3].every(i => board[r + i][c + i] === player)) return true;

  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 3; c < COLS; c++)
      if ([0, 1, 2, 3].every(i => board[r + i][c - i] === player)) return true;

  return false;
}
