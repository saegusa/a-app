export type Player = 'black' | 'white';
export type PieceType = 'king' | 'rook' | 'bishop' | 'gold' | 'silver' | 'knight' | 'lance' | 'pawn';

export interface Piece {
  type: PieceType;
  owner: Player;
  promoted: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from?: Position;
  to: Position;
  piece: Piece;
  drop?: PieceType;
  promote?: boolean;
  captured?: Piece;
}

export interface GameState {
  board: (Piece | null)[][];
  turn: Player;
  captured: Record<Player, PieceType[]>;
  winner: Player | null;
}

const PROMOTABLE: PieceType[] = ['rook', 'bishop', 'silver', 'knight', 'lance', 'pawn'];

export function createInitialState(): GameState {
  const board: (Piece | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));

  const place = (r: number, c: number, type: PieceType, owner: Player) => {
    board[r][c] = { type, owner, promoted: false };
  };

  ['lance', 'knight', 'silver', 'gold', 'king', 'gold', 'silver', 'knight', 'lance'].forEach((type, c) => {
    place(0, c, type as PieceType, 'white');
    place(8, c, type as PieceType, 'black');
  });
  place(1, 1, 'bishop', 'white');
  place(1, 7, 'rook', 'white');
  place(7, 1, 'rook', 'black');
  place(7, 7, 'bishop', 'black');

  for (let c = 0; c < 9; c += 1) {
    place(2, c, 'pawn', 'white');
    place(6, c, 'pawn', 'black');
  }

  return {
    board,
    turn: 'black',
    captured: { black: [], white: [] },
    winner: null
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  const board = state.board.map((row) => row.slice());
  const captured = {
    black: [...state.captured.black],
    white: [...state.captured.white]
  };

  if (move.drop) {
    board[move.to.row][move.to.col] = { type: move.drop, owner: state.turn, promoted: false };
    const idx = captured[state.turn].indexOf(move.drop);
    if (idx >= 0) captured[state.turn].splice(idx, 1);
  } else if (move.from) {
    const moving = board[move.from.row][move.from.col];
    if (!moving) return state;

    const target = board[move.to.row][move.to.col];
    if (target) {
      if (target.type !== 'king') {
        captured[state.turn].push(target.type);
      }
    }

    board[move.from.row][move.from.col] = null;
    board[move.to.row][move.to.col] = {
      ...moving,
      promoted: moving.promoted || !!move.promote
    };

    if (target?.type === 'king') {
      return {
        board,
        captured,
        turn: state.turn,
        winner: state.turn
      };
    }
  }

  return {
    board,
    captured,
    turn: state.turn === 'black' ? 'white' : 'black',
    winner: null
  };
}

export function generateMoves(state: GameState, player: Player): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const piece = state.board[r][c];
      if (!piece || piece.owner !== player) continue;
      moves.push(...pieceMoves(state, { row: r, col: c }, piece));
    }
  }

  const pool = state.captured[player];
  for (const drop of pool) {
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (state.board[r][c] === null && canDropPawn(state, player, drop, c)) {
          moves.push({ to: { row: r, col: c }, piece: { type: drop, owner: player, promoted: false }, drop });
        }
      }
    }
  }
  return moves;
}

function canDropPawn(state: GameState, player: Player, drop: PieceType, col: number): boolean {
  if (drop !== 'pawn') return true;
  return !state.board.some((row) => {
    const piece = row[col];
    return piece?.owner === player && piece.type === 'pawn' && !piece.promoted;
  });
}

function pieceMoves(state: GameState, from: Position, piece: Piece): Move[] {
  const dir = piece.owner === 'black' ? -1 : 1;
  const goldLike = piece.promoted && ['pawn', 'lance', 'knight', 'silver'].includes(piece.type);

  if (piece.type === 'king') return stepMoves(state, from, piece, kingVectors());
  if (piece.type === 'gold' || goldLike) return stepMoves(state, from, piece, goldVectors(dir));
  if (piece.type === 'silver') return stepMoves(state, from, piece, silverVectors(dir));
  if (piece.type === 'knight') return stepMoves(state, from, piece, knightVectors(dir));
  if (piece.type === 'pawn') return stepMoves(state, from, piece, [{ row: dir, col: 0 }]);
  if (piece.type === 'lance') return rayMoves(state, from, piece, [{ row: dir, col: 0 }]);
  if (piece.type === 'rook') {
    const basic = rayMoves(state, from, piece, [
      { row: 1, col: 0 },
      { row: -1, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: -1 }
    ]);
    return piece.promoted ? basic.concat(stepMoves(state, from, piece, diagVectors())) : basic;
  }

  const basic = rayMoves(state, from, piece, diagVectors());
  return piece.promoted ? basic.concat(stepMoves(state, from, piece, orthVectors())) : basic;
}

function stepMoves(state: GameState, from: Position, piece: Piece, vectors: Position[]): Move[] {
  const moves: Move[] = [];
  for (const v of vectors) {
    const to = { row: from.row + v.row, col: from.col + v.col };
    if (!inside(to)) continue;
    const target = state.board[to.row][to.col];
    if (target && target.owner === piece.owner) continue;
    moves.push(withPromotion(state, from, to, piece, target));
  }
  return moves.flat();
}

function rayMoves(state: GameState, from: Position, piece: Piece, vectors: Position[]): Move[] {
  const moves: Move[] = [];
  for (const v of vectors) {
    let r = from.row + v.row;
    let c = from.col + v.col;
    while (inside({ row: r, col: c })) {
      const target = state.board[r][c];
      if (target && target.owner === piece.owner) break;
      moves.push(withPromotion(state, from, { row: r, col: c }, piece, target));
      if (target) break;
      r += v.row;
      c += v.col;
    }
  }
  return moves.flat();
}

function withPromotion(state: GameState, from: Position, to: Position, piece: Piece, target?: Piece | null): Move[] {
  const base: Move = { from, to, piece, captured: target ?? undefined };
  if (!PROMOTABLE.includes(piece.type) || piece.promoted) return [base];

  const zone = piece.owner === 'black' ? [0, 1, 2] : [6, 7, 8];
  if (!zone.includes(from.row) && !zone.includes(to.row)) return [base];

  return [base, { ...base, promote: true }];
}

function inside(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9;
}

function kingVectors(): Position[] {
  return [
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 }
  ];
}

function goldVectors(dir: number): Position[] {
  return [
    { row: dir, col: 0 },
    { row: dir, col: 1 },
    { row: dir, col: -1 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
    { row: -dir, col: 0 }
  ];
}

function silverVectors(dir: number): Position[] {
  return [
    { row: dir, col: 0 },
    { row: dir, col: 1 },
    { row: dir, col: -1 },
    { row: -dir, col: 1 },
    { row: -dir, col: -1 }
  ];
}

function knightVectors(dir: number): Position[] {
  return [
    { row: dir * 2, col: 1 },
    { row: dir * 2, col: -1 }
  ];
}

function diagVectors(): Position[] {
  return [
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 }
  ];
}

function orthVectors(): Position[] {
  return [
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 }
  ];
}

export function cpuPickMove(state: GameState): Move | null {
  const moves = generateMoves(state, state.turn);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export function pieceLabel(piece: Piece): string {
  const map: Record<PieceType, string> = {
    king: '王',
    rook: '飛',
    bishop: '角',
    gold: '金',
    silver: '銀',
    knight: '桂',
    lance: '香',
    pawn: '歩'
  };
  const label = map[piece.type];
  return piece.promoted ? `成${label}` : label;
}
