# shared — Web / モバイル共通コード

API の型・呼び出し・画面ロジック・文言を 1 か所にまとめ、Web（`app/web`）と
モバイル（`app/mobile`）の仕様がずれないようにするためのディレクトリ。

- Web からは `@shared/*`（`vite.config.ts` / `tsconfig.app.json` の alias）で読む
- モバイルからも `@shared/*`（`app/mobile/tsconfig.json` の paths と `metro.config.js` の watchFolders）で読む
- 置き場所が `app/web` の中なのは、本番の Web イメージ（`platform/web.prod.Dockerfile`）が
  `app/web` だけをビルドコンテキストにしているため

## ルール

- **npm パッケージを import しない。** モバイルから読むと `app/web/node_modules` 側で解決され、
  React などが二重に読み込まれるため。React のフックは各アプリ側に置き、ここには純粋な関数・定数・型だけを置く
- 文言は `copy.ts`、キャッシュのキーと取り直す範囲は `queries.ts` に集める
- Apple Watch（Swift）はこのコードを読めないので、`timer.ts` の既定値と `copy.ts` の文言は
  `app/mobile/targets/` 側に同じ値を写してある。変えるときは両方直す
