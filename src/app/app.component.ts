import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { applyMove, CpuLevel, cpuPickMove, createInitialState, GameState, generateMoves, Move, Piece, pieceLabel, PieceType, Player } from '../lib/shogi';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  state: GameState = createInitialState();
  selected: { row: number; col: number } | null = null;
  selectedDrop: PieceType | null = null;
  legalMoves: Move[] = [];
  log: string[] = [];
  playerSide: Player = 'black';
  cpuLevel: CpuLevel = 'random';
  furigomaResult = '';
  readonly files = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  readonly ranks = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  readonly pieceOrder: PieceType[] = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];
  private svgCache = new Map<string, string>();

  constructor() {
    this.reset();
  }

  get board(): (Piece | null)[][] {
    return this.state.board;
  }

  get turnLabel(): string {
    return this.state.turn === 'black' ? '先手' : '後手';
  }

  get playerLabel(): string {
    return this.playerSide === 'black' ? '先手' : '後手';
  }

  get cpuLabel(): string {
    return this.playerSide === 'black' ? '後手' : '先手';
  }

  get currentActor(): string {
    if (this.state.winner) {
      return this.state.winner === this.playerSide ? 'あなたの勝ち' : 'CPUの勝ち';
    }
    return this.state.turn === this.playerSide ? 'あなたの手番' : 'CPUの手番';
  }

  onCellClick(row: number, col: number): void {
    if (this.state.winner) return;
    if (this.state.turn !== this.playerSide) return;

    if (this.selectedDrop) {
      const move = this.legalMoves.find((m) => m.drop === this.selectedDrop && m.to.row === row && m.to.col === col);
      if (move) this.playMove(move);
      return;
    }

    const piece = this.state.board[row][col];
    if (this.selected && this.legalMoves.length > 0) {
      const candidates = this.legalMoves.filter((m) => m.to.row === row && m.to.col === col);
      const move = this.pickMoveCandidate(candidates);
      if (move) {
        this.playMove(move);
        return;
      }
    }

    if (piece?.owner === this.playerSide) {
      this.selected = { row, col };
      this.selectedDrop = null;
      this.legalMoves = generateMoves(this.state, this.playerSide).filter((m) => m.from?.row === row && m.from?.col === col);
    }
  }

  selectDrop(type: PieceType): void {
    if (this.state.turn !== this.playerSide) return;
    this.selected = null;
    this.selectedDrop = type;
    this.legalMoves = generateMoves(this.state, this.playerSide).filter((m) => m.drop === type);
  }

  reset(): void {
    this.state = createInitialState();
    this.selected = null;
    this.selectedDrop = null;
    this.legalMoves = [];
    this.log = [];

    this.playerSide = Math.random() < 0.5 ? 'black' : 'white';
    this.furigomaResult = this.playerSide === 'black' ? '振り駒: あなたが先手になりました。' : '振り駒: あなたが後手になりました。';

    if (this.state.turn !== this.playerSide) {
      setTimeout(() => this.cpuTurn(), 200);
    }
  }

  canMoveTo(row: number, col: number): boolean {
    return this.legalMoves.some((m) => m.to.row === row && m.to.col === col);
  }

  isSelected(row: number, col: number): boolean {
    return this.selected?.row === row && this.selected?.col === col;
  }

  label(row: number, col: number): string {
    const piece = this.state.board[row][col];
    if (!piece) return '';
    const base = pieceLabel(piece);
    return piece.owner === 'black' ? base : `v${base}`;
  }

  pieceImage(row: number, col: number): string {
    const piece = this.state.board[row][col];
    if (!piece) return '';

    const key = `${piece.owner}:${piece.type}:${piece.promoted}`;
    const hit = this.svgCache.get(key);
    if (hit) return hit;

    const svg = this.createPieceSvg(piece);
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    this.svgCache.set(key, url);
    return url;
  }

  countCaptured(player: Player, type: PieceType): number {
    return this.state.captured[player].filter((p) => p === type).length;
  }

  pieceName(type: PieceType): string {
    return pieceLabel({ type, owner: 'black', promoted: false });
  }


  private playMove(move: Move): void {
    const actor = this.state.turn === this.playerSide ? 'あなた' : 'CPU';
    this.state = applyMove(this.state, move);
    this.log.unshift(`${actor}: ${move.drop ? '打' + this.pieceName(move.drop) : `${move.from?.row},${move.from?.col}`} → ${move.to.row},${move.to.col}${move.promote ? ' 成' : ''}`);
    this.selected = null;
    this.selectedDrop = null;
    this.legalMoves = [];

    if (!this.state.winner && this.state.turn !== this.playerSide) {
      setTimeout(() => this.cpuTurn(), 200);
    }
  }

  private cpuTurn(): void {
    if (this.state.turn === this.playerSide || this.state.winner) return;
    const picked = cpuPickMove(this.state, this.cpuLevel);
    if (!picked) {
      this.state.winner = this.playerSide;
      return;
    }
    this.state = applyMove(this.state, picked);
    this.log.unshift(`CPU: ${picked.drop ? '打' + this.pieceName(picked.drop) : `${picked.from?.row},${picked.from?.col}`} → ${picked.to.row},${picked.to.col}${picked.promote ? ' 成' : ''}`);
  }

  private pickMoveCandidate(candidates: Move[]): Move | undefined {
    if (candidates.length <= 1) return candidates[0];

    const promote = candidates.find((m) => m.promote);
    const normal = candidates.find((m) => !m.promote);
    if (!promote || !normal) return candidates[0];

    return confirm('成りますか？') ? promote : normal;
  }

  private createPieceSvg(piece: Piece): string {
    const text = pieceLabel(piece);
    const rotation = piece.owner === 'white' ? ' rotate(180 50 50)' : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-label="${text}">
  <defs>
    <linearGradient id="koma" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2d89a"/>
      <stop offset="100%" stop-color="#d9ad64"/>
    </linearGradient>
  </defs>
  <polygon points="50,6 90,20 80,93 20,93 10,20" fill="url(#koma)" stroke="#744d1d" stroke-width="4"/>
  <g transform="${rotation.trim()}">
    <text x="50" y="63" text-anchor="middle" font-size="36" font-family="'Yu Mincho','Hiragino Mincho ProN',serif" fill="#1d1004">${text}</text>
  </g>
</svg>`;
  }
}
