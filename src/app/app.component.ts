import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { applyMove, cpuPickMove, createInitialState, GameState, generateMoves, Move, Piece, pieceLabel, PieceType, Player } from '../lib/shogi';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  state: GameState = createInitialState();
  selected: { row: number; col: number } | null = null;
  selectedDrop: PieceType | null = null;
  legalMoves: Move[] = [];
  log: string[] = [];
  private svgCache = new Map<string, string>();

  get board(): (Piece | null)[][] {
    return this.state.board;
  }

  get turnLabel(): string {
    return this.state.turn === 'black' ? '先手' : '後手';
  }

  onCellClick(row: number, col: number): void {
    if (this.state.winner) return;
    if (this.state.turn !== 'black') return;

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

    if (piece?.owner === 'black') {
      this.selected = { row, col };
      this.selectedDrop = null;
      this.legalMoves = generateMoves(this.state, 'black').filter((m) => m.from?.row === row && m.from?.col === col);
    }
  }

  selectDrop(type: string): void {
    if (this.state.turn !== 'black') return;
    this.selected = null;
    this.selectedDrop = type as PieceType;
    this.legalMoves = generateMoves(this.state, 'black').filter((m) => m.drop === type as PieceType);
  }

  reset(): void {
    this.state = createInitialState();
    this.selected = null;
    this.selectedDrop = null;
    this.legalMoves = [];
    this.log = [];
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

  countCaptured(player: Player, type: string): number {
    return this.state.captured[player].filter((p) => p === type as PieceType).length;
  }

  private playMove(move: Move): void {
    const actor = this.state.turn === 'black' ? '先手' : 'CPU';
    this.state = applyMove(this.state, move);
    this.log.unshift(`${actor}: ${move.drop ? '打' + move.drop : `${move.from?.row},${move.from?.col}`} -> ${move.to.row},${move.to.col}${move.promote ? ' 成' : ''}`);
    this.selected = null;
    this.selectedDrop = null;
    this.legalMoves = [];

    if (!this.state.winner) {
      setTimeout(() => this.cpuTurn(), 200);
    }
  }

  private cpuTurn(): void {
    if (this.state.turn !== 'white' || this.state.winner) return;
    const picked = cpuPickMove(this.state);
    if (!picked) {
      this.state.winner = 'black';
      return;
    }
    this.state = applyMove(this.state, picked);
    this.log.unshift(`CPU: ${picked.drop ? '打' + picked.drop : `${picked.from?.row},${picked.from?.col}`} -> ${picked.to.row},${picked.to.col}${picked.promote ? ' 成' : ''}`);
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
  <polygon points="50,6 92,22 82,94 18,94 8,22" fill="#f5df9e" stroke="#6d4c1f" stroke-width="4"/>
  <g transform="${rotation.trim()}">
    <text x="50" y="62" text-anchor="middle" font-size="34" font-family="'Hiragino Mincho ProN','Yu Mincho',serif" fill="#231400">${text}</text>
  </g>
</svg>`;
  }
}
