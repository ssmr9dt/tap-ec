# ウェブゲーム

ウェブ上で遊べるゲームの開発環境です。

## セットアップ

### 必要な環境
- Node.js (推奨: v16以上)

### インストール

```bash
npm install
```

## 実行方法

### 開発サーバーの起動

```bash
npm start
```

または

```bash
npm run dev
```

ブラウザで `http://localhost:8080` が自動的に開きます。

### 直接HTMLファイルを開く

`index.html` をブラウザで直接開くこともできます。

## ファイル構成

- `index.html` - メインのHTMLファイル
- `styles.css` - スタイルシート
- `game.js` - ゲームロジック
- `package.json` - プロジェクト設定

## ゲームのカスタマイズ

`game.js` ファイルを編集して、独自のゲームを作成できます。

### 基本的な構造

- `init()` - ゲームの初期化
- `gameLoop()` - メインゲームループ
- `update()` - ゲームロジックの更新
- `draw()` - 描画処理

## ライセンス

MIT