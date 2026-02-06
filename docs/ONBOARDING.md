# オンボーディングガイド

## 1. リポジトリ構造
- `src/app/`: Angular UI 層
- `src/lib/`: 将棋ロジック
- `docs/`: 運用ドキュメント

## 2. 開発開始手順
1. Node.js LTS を用意
2. `npm install`
3. `npm run start`
4. `http://localhost:4200` を開く

## 3. まず読むドキュメント
1. `docs/ARCHITECTURE.md`
2. `docs/IMPLEMENTATION_LOG.md`

## 4. MVP の現状
- 通常将棋の対 CPU 対戦
- CPU はランダム合法手
- ルールは MVP 水準（完全準拠は今後対応）

## 5. セキュリティ確認
- 依存導入後に `npm run audit` を実行し、0 vulnerabilities を確認する。
