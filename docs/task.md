# 人生のコンパス タスク一覧

最終更新: 2026-07-16 ／ 設計は [design.md](design.md) を参照

各タスクは **AI コーディングエージェント（Claude Code 等）に 1 件ずつ依頼できる粒度**に分解している。

- 依頼時は「design.md の該当章 + このタスクの完了条件」をプロンプトに含めること
- **区分** … `AI`: AI 単独で完結 ／ `AI+人`: AI が実装し人間が実機・アカウントで確認 ／ `人`: 人間のみ（Apple Developer 契約など）
- 番号順がそのまま推奨着手順。依存が同じタスクは並行依頼可

---

## Phase 0: 基盤

### T-001 Laravel プロジェクト初期化 ［AI］
- 依存: なし
- 内容: `app/api` に Laravel 11 を新規作成し、`.env` を Docker の MySQL（design.md 2章・db サービス）に合わせて設定。Sanctum を導入
- 完了条件: `docker compose -f platform/docker-compose.yml up -d` 後、`http://localhost:8000` で Laravel の初期画面が返り、`php artisan migrate` が成功する

### T-002 React (Vite) プロジェクト初期化 ［AI］
- 依存: なし
- 内容: `app/web` に Vite + React 19 + TypeScript を新規作成。TanStack Query / Zustand / ルーター導入。API ベース URL は `VITE_API_URL` で注入
- 完了条件: Docker の web コンテナ経由で `http://localhost:3000` にトップページが表示される

### T-003 docker-compose の調整 ［AI］
- 依存: T-001, T-002
- 内容: web コンテナを Vite 起動（`npm run dev -- --host 0.0.0.0 --port 3000`）へ変更、api コンテナを composer / pdo_mysql 入り Dockerfile（`platform/api.Dockerfile`）へ置換。Laravel スケジューラ用コンテナ（`schedule:work`）を追加
- 完了条件: `docker compose up -d` だけで web / api / db / scheduler の 4 コンテナが安定稼働する

### T-004 DB マイグレーション+モデル作成 ［AI］
- 依存: T-001
- 内容: design.md 5章の 6 テーブル（users 拡張, tasks, comparisons, task_logs, notifications, device_tokens）のマイグレーション・Eloquent モデル・factory・seeder を作成
- 完了条件: `php artisan migrate:fresh --seed` が成功し、seeder でユーザー 1 名+タスク 10 件が入る

---

## Phase 1: タスク登録・二択比較・ランキング

### T-101 認証 API ［AI］
- 依存: T-004
- 内容: design.md 6章の /auth/register, /auth/login, /auth/logout を実装（Sanctum トークン）。Feature テスト付き
- 完了条件: `php artisan test` が通り、curl でトークン取得→認証付きリクエストが成功する

### T-102 タスク CRUD API ［AI］
- 依存: T-101
- 内容: GET/POST/PATCH/DELETE /tasks。title のみ必須、active 100 件超で 422。rating 初期値 1500
- 完了条件: Feature テスト（上限バリデーション含む）が通る

### T-103 Elo レーティングサービス ［AI］
- 依存: T-004
- 内容: design.md 7章の Elo 更新ロジックを独立クラスで実装（K=32、比較 10 回未満は K=64）。単体テストで数値を検証
- 完了条件: 既知の入力に対する期待レート（手計算値）とテストが一致する

### T-104 比較 API ［AI］
- 依存: T-102, T-103
- 内容: GET /comparisons/next（比較回数が少なく rating が近いペアを返す）、POST /comparisons（Elo 更新 + 履歴保存）
- 完了条件: 比較を繰り返すと GET /tasks の順位が回答どおり収束することをテストで確認

### T-105 Web: 認証+タスク登録画面 ［AI］
- 依存: T-002, T-101, T-102
- 内容: ログイン/登録画面、タスク一覧+タイトルだけの追加フォーム
- 完了条件: ブラウザでログイン→タスク追加→一覧反映まで動作する

### T-106 Web: 二択比較画面 ［AI］
- 依存: T-105, T-104
- 内容: readme の UI（左/右/あとで決める）。回答は 1〜2 秒で次ペアへ。キーボード ←/→ 対応
- 完了条件: 連続回答ができ、ランキング画面に順位が反映される

### T-107 Web: ランキング画面 ［AI］
- 依存: T-105
- 内容: rating 降順の TOP 表示
- 完了条件: 比較結果に応じた並びが表示される

---

## Phase 2: 今日のおすすめ・通知・完了記録

### T-201 おすすめスコアサービス+ /compass/today ［AI］
- 依存: T-104
- 内容: design.md 8章のスコア計算（w4 は無効のまま）。単体テスト付き
- 完了条件: rating・経過日数・締切の組合せに対する期待順位がテストで一致する

### T-202 実施記録 API+ダッシュボード API ［AI］
- 依存: T-201
- 内容: POST /task-logs（done/partial/skipped、elapsed_seconds）、GET /dashboard（今日のおすすめ/TOP10/今週完了数/比較回数/継続日数）。task 完了時に last_done_at 更新
- 完了条件: Feature テストが通る

### T-203 Web: 今日のコンパス+完了記録+ダッシュボード ［AI］
- 依存: T-106, T-202
- 内容: readme のホーム画面（🧭 今日の一歩 → 開始 → タイマー → 結果入力: 😊完了/😅少しだけ/❌また今度）とダッシュボード
- 完了条件: 開始→タイマー→結果記録→ダッシュボード反映が一連で動く

### T-204 通知スケジューラ ［AI］
- 依存: T-201
- 内容: 毎分実行で notification_time 一致ユーザーに「今日の一歩」を生成し notifications へ記録、送信ジョブへ投入。1 日 1 通の重複防止テスト必須
- 完了条件: 時刻を偽装したテストで「同日 2 通目が送られない」ことを検証

### T-205 APNs / FCM 送信実装 ［AI+人］
- 依存: T-204, T-901
- 内容: device_tokens 宛の送信処理と POST /devices。認証鍵は .env で注入
- 完了条件: コードとテストは AI が完結。実機への着信確認は人間

---

## Phase 3: モバイル+Apple Watch

### T-301 Expo プロジェクト初期化 ［AI］
- 依存: T-101
- 内容: `app/mobile` に Expo + TypeScript。認証・タスク一覧・二択比較・今日のコンパス画面（Web と同等機能）を実装
- 完了条件: Expo Go / シミュレータでログイン→比較→今日の一歩まで動作する

### T-302 モバイル: プッシュ通知受信 ［AI+人］
- 依存: T-301, T-205
- 内容: 通知許可取得・トークン登録・インタラクティブ通知（[開始][あとで]）のカテゴリ実装。[開始] でタイマー画面へディープリンク
- 完了条件: コードは AI。実機での通知動作確認は人間

### T-303 expo-apple-targets で watch ターゲット追加 ［AI+人］ ✅ AI 側完了（2026-07-16）
- 依存: T-301
- 内容: `@bacons/apple-targets` を導入し `targets/watch/`（type: watch）と `targets/watch-widget/`（type: watch-widget、T-306用）を作成。App Group `group.com.lifecompass.mobile` を両ターゲットに設定
- 完了条件: `npx expo prebuild -p ios --clean` 後、`LifeCompassWatch` / `LifeCompassComplication` スキームが watch シミュレータ向けに `xcodebuild` でビルド成功することを確認済み（CocoaPods を 1.17.0 に更新して解決）
- 残作業（人間）: `app.json` の `ios.appleTeamId` 設定、Apple Developer Program での App Group 登録・実機での signing（T-901 依存）

### T-304 Watch: 今日の一歩画面 ［AI+人］ ✅ AI 側完了（2026-07-16）
- 依存: T-303
- 内容: `targets/watch/TodayStepView.swift` で「🧭 今日の一歩 / タイトル / 所要時間 / 開始する」画面を実装。`PhoneConnector.swift`（WCSessionDelegate）が iPhone からの applicationContext を受信、未受信時は `APIClient.swift`（URLSession）で `/compass/today` を直接取得
- 完了条件: watch シミュレータ向けビルド成功で確認済み（実機・実データでの表示確認は人間）

### T-305 Watch: タイマー+結果入力 ［AI+人］ ✅ AI 側完了（2026-07-16）
- 依存: T-304
- 内容: `TimerView.swift`（`WKExtendedRuntimeSession` でバックグラウンド継続）+ `ResultView.swift`（結果入力ワンタップ、SF Symbols表記: checkmark.circle.fill=完了/circle.lefthalf.filled=少しだけ/xmark.circle.fill=また今度、`elapsed_seconds` 送信、POST /task-logs source=watch）
- 完了条件: watch シミュレータ向けビルド成功で確認済み（実機での開始→終了→API到達確認は人間）

### T-306 Watch: WidgetKit コンプリケーション ［AI+人］ ✅ AI 側完了（2026-07-16）
- 依存: T-304
- 内容: `targets/watch-widget/widgets.swift` で SharedStore（App Group 経由）の「今日の一歩」タイトルを表示するコンプリケーション（accessoryCircular / accessoryRectangular / accessoryInline）
- 完了条件: watch シミュレータ向けビルド成功で確認済み（実機の文字盤での表示確認は人間）

### T-307 RN ↔ Watch 連携ブリッジ ［AI+人］ ✅ AI 側完了（2026-07-16）
- 依存: T-303
- 内容: `react-native-watch-connectivity` を導入。`src/watch/sync.ts` が `updateApplicationContext` でログイントークン（auth-store の hydrate/setToken/clearToken 時）と今日の一歩（today.tsx の取得時）を Watch へ同期
- 完了条件: コード実装・型チェック・prebuild/ビルド確認済み（iPhone実機でログイン→Watch側でAPIを呼べる状態になることの確認は人間）

---

## Phase 4 以降（着手時に詳細化）

- T-401 AI おすすめ（Claude API で文脈付き提案文を生成）［AI］
- T-402 Google Calendar 連携（空き時間取得 → w4 有効化）［AI+人: OAuth 設定］
- T-403 Apple ヘルスケア連携（睡眠・歩数で補正）［AI+人: 実機］
- T-404 天気連携（天気 API → 屋外/屋内タスク補正）［AI］
- T-501 家族共有・年間レビュー・Web 版拡張（要追加設計）

---

## 人間にしかできない作業（先行して準備しておくもの）

| ID | 内容 | 必要になるタスク |
|----|----|----|
| T-901 | Apple Developer Program 契約、APNs 認証キー発行、Firebase プロジェクト作成 | T-205 以降 |
| T-902 | 実機（iPhone / Apple Watch）でのテスト・TestFlight 配布 | T-302〜T-307 |
| T-903 | App Store / Google Play 申請 | リリース時 |

---

## AI へ依頼するときのテンプレート

```
docs/design.md と docs/task.md を読んでください。
T-XXX を実装してください。
- 完了条件を満たすこと
- テストを書き、通ることを確認すること
- 既存のディレクトリ構成・コーディング規約に従うこと
```
