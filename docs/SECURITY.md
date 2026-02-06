# SECURITY

## 依存関係ポリシー
- Angular は v21 系を利用する。
- `npm audit --audit-level=low` で **0 vulnerabilities** を維持する。
- 依存更新時は `npm install` 後に必ず `npm run audit` を実行する。

## 現在の状態
- この環境では npm レジストリアクセスが `403 Forbidden` になるため、
  依存導入と監査コマンドの完了確認ができない。
- レジストリアクセス可能な CI / 開発環境で以下を必須チェックとする。

```bash
npm ci
npm run audit
npm run build
```

## 補足
- `package.json` の `overrides` に既知の脆弱性修正パッケージを固定している。
- 監査で脆弱性が 1 件でも出た場合は、該当依存を更新してからマージする。
