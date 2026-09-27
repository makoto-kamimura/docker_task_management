# 人生のコンパス タスク一覧

最終更新: 2026-09-27 ／ 仕様は [readme.md](../../readme.md) を参照

各タスクは **AI コーディングエージェント（Claude Code 等）に 1 件ずつ依頼できる粒度**に分解している。

- 依頼時は「readme の該当章 + このタスクの完了条件」をプロンプトに含めること
- **区分** … `AI`: AI 単独で完結 ／ `AI+人`: AI が実装し人間が実機・アカウントで確認 ／ `人`: 人間のみ（Apple Developer 契約など）
- 番号順がそのまま推奨着手順。依存が同じタスクは並行依頼可

---

## Phase 0: 基盤

### T-001 Laravel プロジェクト初期化 ［AI］
- 依存: なし
- 内容: `app/api` に Laravel 11 を新規作成し、`.env` を Docker の MySQL（readme 16.6節・db サービス）に合わせて設定。Sanctum を導入
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
- 内容: readme 第19章の 6 テーブル（users 拡張, tasks, comparisons, task_logs, notifications, device_tokens）のマイグレーション・Eloquent モデル・factory・seeder を作成
- 完了条件: `php artisan migrate:fresh --seed` が成功し、seeder でユーザー 1 名+タスク 10 件が入る

---

## Phase 1: タスク登録・二択比較・ランキング

### T-101 認証 API ［AI］
- 依存: T-004
- 内容: readme 20.1節の /auth/register, /auth/login, /auth/logout を実装（Sanctum トークン）。Feature テスト付き
- 完了条件: `php artisan test` が通り、curl でトークン取得→認証付きリクエストが成功する

### T-102 タスク CRUD API ［AI］
- 依存: T-101
- 内容: GET/POST/PATCH/DELETE /tasks。title のみ必須、active 100 件超で 422。rating 初期値 1500
- 完了条件: Feature テスト（上限バリデーション含む）が通る

### T-103 Elo レーティングサービス ［AI］
- 依存: T-004
- 内容: readme 18.2節の Elo 更新ロジックを独立クラスで実装（K=32、比較 10 回未満は K=64）。単体テストで数値を検証
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
- 内容: readme 7.1節の UI（左/右/あとで決める）。回答は 1〜2 秒で次ペアへ。キーボード ←/→ 対応
- 完了条件: 連続回答ができ、ランキング画面に順位が反映される

### T-107 Web: ランキング画面 ［AI］
- 依存: T-105
- 内容: rating 降順の TOP 表示
- 完了条件: 比較結果に応じた並びが表示される

---

## Phase 2: 今日のおすすめ・通知・完了記録

### T-201 おすすめスコアサービス+ /compass/today ［AI］
- 依存: T-104
- 内容: readme 18.3節のスコア計算（w4 は無効のまま）。単体テスト付き
- 完了条件: rating・経過日数・締切の組合せに対する期待順位がテストで一致する

### T-202 実施記録 API+ダッシュボード API ［AI］
- 依存: T-201
- 内容: POST /task-logs（done/partial/skipped、elapsed_seconds）、GET /dashboard（今日のおすすめ/TOP10/今週完了数/比較回数/継続日数）。task 完了時に last_done_at 更新
- 完了条件: Feature テストが通る

### T-203 Web: 今日のコンパス+完了記録+ダッシュボード ［AI］
- 依存: T-106, T-202
- 内容: readme 第8章・第9章のホーム画面（🧭 今日の一歩 → 開始 → タイマー → 結果入力: 😊完了/😅少しだけ/❌また今度）とダッシュボード
- 完了条件: 開始→タイマー→結果記録→ダッシュボード反映が一連で動く

### T-204 通知スケジューラ ［AI］
- 依存: T-201
- 内容: 毎分実行で notification_time 一致ユーザーに「今日の一歩」を生成し notifications へ記録、送信ジョブへ投入。1 日 1 通の重複防止テスト必須
- 完了条件: 時刻を偽装したテストで「同日 2 通目が送られない」ことを検証
- 備考: 送信の起点は T-221 で「固定時刻 1 日 1 通」から「隙間時間の開始ごと」に変更済み

### T-205 APNs / FCM 送信実装 ［AI+人］
- 依存: T-204, T-901
- 内容: device_tokens 宛の送信処理と POST /devices。認証鍵は .env で注入
- 完了条件: コードとテストは AI が完結。実機への着信確認は人間

---

## Phase 2.5: タスクツリー（Goal Tree）

### T-210 タスクツリー導入 ［AI］ ✅ 完了（2026-07-18）
- 依存: T-203
- 内容: [readme 第6章](../../readme.md#6-やりたいことタスクツリー) の仕様を導入。tasks に parent_id（自己参照 FK・最大 5 階層・循環防止・カスケード削除）を追加。二択比較とランキングはルートのみを対象にし、/compass/today はスコア最高のルートのツリーをたどって葉を「今日の一歩」として返す（ルートからの path 付き）。Web はツリー表示+子タスク追加 UI、今日の一歩にパンくず表示
- 完了条件: Feature/Unit テスト（69 件）が通り、API で ルート→子→孫 作成 → /compass/today が葉+path を返すことを確認済み
- 備考: モバイル/Watch は API 後方互換（GET /tasks はデフォルトでルートのみ、path は追加フィールド）のため変更不要。ツリー UI のモバイル対応は未着手

---

## Phase 2.6: タイムスケジュール

### T-220 タイムスケジュール登録+円グラフ表示 ［AI］ ✅ 完了（2026-08-31）
- 依存: T-210
- 内容: `schedule_blocks` テーブル（date + 0:00 起点の分。同一日の時間帯重複は 422）と CRUD API を追加。
  任意で「やりたいこと」に紐付けできる（タスク削除時は予定を残して task_id を NULL に）。
  Web `/schedule` とモバイル「時間割」タブに、24 時間を 1 周とするドーナツ円グラフ+一覧+登録フォームを実装。
  設計方針は [readme 18.6節](../../readme.md#186-円グラフの描画)
- 完了条件: Feature テスト（全 70 件）が通り、実 API で 登録 → 重複登録が 422 → 一覧取得 まで確認済み。
  Web / モバイルとも `tsc --noEmit` がクリーン
- 備考: モバイルの円グラフ描画に `react-native-svg@15.12.1`（Expo SDK 54 対応版）を追加。
  Watch は未対応。日付単位の仕様は T-221 で曜日単位に置き換えた

### T-221 週間スケジュール化+隙間時間リマインダー ［AI］ ✅ 完了（2026-08-31）
- 依存: T-220, T-204
- 内容: T-220 の日付単位（`date`）を曜日単位（`day_of_week` 0=日〜6=土）に置き換え、
  1 週間ぶんの型を一度登録すれば毎週使い回せるようにした。
  予定の塗り残しを「隙間時間」として導出する `FreeSlotService` と
  `GET /schedule-blocks/free-slots` を追加（[readme 18.7節](../../readme.md#187-隙間時間の算出)）。
  通知は `users.notification_time` の 1 日 1 通を廃止し、隙間の開始時刻ちょうどに送る
  `notifications:dispatch-free-slots` へ置き換え（readme 18.8節）。
  細切れ・深夜を弾くため users に `reminder_min_gap_minutes` /
  `reminder_window_start_minute` / `reminder_window_end_minute` を追加し、
  `GET|PATCH /reminder-settings` で変更できるようにした。
  Web / モバイルとも曜日タブ（月曜始まり・空き時間の合計付き）+ 隙間時間一覧 + 設定 UI を実装
- 完了条件: Feature/Unit テスト（全 110 件）が通り、Web / モバイルとも `tsc --noEmit` がクリーン
- 備考: 特定日だけの例外予定（旅行など）は未対応。Watch も未対応。
  隙間の長さが取れるようになったため readme 18.3節の w4 は外部カレンダー連携なしで有効化できる（未実装）

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

### T-308 Web / iOS / watchOS の仕様統一+共通化リファクタリング ［AI+人］ ✅ AI 側完了（2026-09-11）
- 依存: T-221, T-307
- 内容: 3 端末で食い違っていた仕様を [readme 第4章](../../readme.md#4-画面一覧) の表にそろえた。
  - 共通化: Web とモバイルで二重に持っていた型・API 呼び出し・時間割の計算・文言を `app/web/src/shared/` に 1 本化し、両方から `@shared/*` で読む。
    キャッシュの取り直し範囲も共通化（二択の回答後に今日の一歩・ダッシュボードが古いまま残る不具合を解消）
  - iOS: 時間割に Web だけにあった機能（スキマ ON/OFF・他の曜日へコピー・よく使う項目・睡眠/運動/スキマの合計・入力中のプレビュー）を追加。
    ダッシュボード（ランキング込み）とログアウトを追加。やるべきことで入力欄を開くと閉じられず「分解完了」も押せなかった不具合を修正
  - Web: ランキングをダッシュボードへ統合（`/ranking` は転送）、ナビゲーションを iOS のタブと同じ順に。
    ログイン済みで `/`・`/login` を開いたら今日の一歩へ。予定の削除に確認を追加
  - watchOS: 今日の一歩にパンくずと「15分でできない」を追加、結果記録後は今日の一歩へ戻る、通知の [開始] でタイマーを開く、
    API のベース URL を iPhone から受け取る、絵文字を SF Symbols に置き換え（少しだけ = `clock.fill`）
  - 3 端末共通: タイマーを開始時刻との差で計算（バックグラウンドでずれない）、結果の送信失敗を表示、ログアウト時にキャッシュを破棄
  - `@bacons/apple-targets` が SDK 54 で読み込めず app.json から外れていたため、`@expo/prebuild-config@~54.0.9` を追加して復帰
- 完了条件: Web / モバイルとも `tsc`（Web は strict 化）がクリーン、Web の lint・本番ビルド、iOS の JS バンドル（`expo export`）、
  `expo prebuild -p ios` で `LifeCompassWatch` / `LifeCompassComplication` ターゲットが生成されることを確認済み
- 残作業（人間）: Swift の変更は Xcode でのビルド・実機（iPhone / Apple Watch）での動作確認が必要（この環境には Swift ツールチェーンがない）
- 備考: 同日、`app/api/.env.example` と docker_wordpress の `platform/.env.example` に鍵（APP_KEY / TASK_APP_KEY・APNs・FCM）の入れ方を追記し、
  `wait-for-db.sh` が環境変数の APP_KEY を尊重するよう修正。`demo-task-web` / `demo-task-api` を本番へ反映済み

### T-309 Web: デスクトップ向けレイアウト ［AI］ ✅ 完了（2026-09-11）
- 依存: T-308
- 内容: Web がスマホと同じ 480px 幅の 1 列表示だったのを、デスクトップで見やすい配置にする。
  左サイドバーのナビゲーション、画面ごとの 2 列配置（時間割は円グラフを左に固定し一覧・フォームを右、やりたいことはフォームを左・ツリーを右 など）、
  カードのグリッド表示。狭い画面では従来どおり 1 列に戻す。機能・文言は変えない（readme 第4章の表は維持）
- 完了条件: `tsc` / lint / 本番ビルドがクリーンで、デスクトップ幅・スマホ幅の両方で表示を確認
  （ダミー API を立てて 1440px / 390px で全画面を撮影して確認。390px で横スクロールが出ないことも確認済み）
- 備考: 幅 900px 以下ではサイドバーを上部の横並びに、1024px 以下では 2 列を 1 列に畳む。
  あわせて `.button-secondary` を単独で使うと枠だけの小さなボタンになっていた既存の不具合を修正

### T-310 時間割を「週間タイムテーブル / スキマ時間設定」のタブに分ける ［AI］ ✅ 完了（2026-09-11）
- 依存: T-309
- 内容: 時間割の画面見出しを「時間割」にし、その下にタブを置く。予定の登録（円グラフ・一覧・フォーム）は「週間タイムテーブル」、
  「〇曜の隙間時間」の一覧とリマインドの設定（最小の隙間・通知してよい時間帯）は「スキマ時間設定」へ移した。
  曜日の選択は両タブ共通。Web / iOS の両方に同じ構成で入れ、Web はタブを URL（`?tab=slots`）に持つ
- 完了条件: Web / モバイルとも `tsc` がクリーン、Web の lint・本番ビルド、両タブをデスクトップ幅・スマホ幅で表示確認

### T-311 履歴書（今の履歴書 / 将来の履歴書と必要なタスク） ［AI］ ✅ 完了（2026-09-11）
- 依存: T-310
- 内容: 就職・転職用の履歴書を追加（[readme 第19章](../../readme.md#19-データモデル) resume_profiles / resume_entries、[第20章](../../readme.md#20-api) /resume）。
  JIS 様式に近い項目を持つが個人情報はすべて任意入力で、文字列は APP_KEY で暗号化して保存する。
  「将来の履歴書」に書いた目標は同名の「やりたいこと」（ルートタスク）になり、目標ごとに必要なタスクを子として登録できる。
  達成したら今の履歴書へ移し、タスクは archived にする。Web / iOS の両方に「履歴書」画面（今 / 将来のタブ）を追加
- 完了条件: API の Feature テスト（履歴書 15 件を含む全 153 件）が通り、Web / モバイルとも `tsc` がクリーン、
  Web の lint・本番ビルドと iOS の JS バンドルが成功。本番とは別の使い捨て API（SQLite）で
  登録 → プロフィール入力 → 学歴追加 → 目標追加 → 必要なタスク追加 → 今日の一歩に出る → 達成 までを画面から通しで確認し、
  DB 上で個人情報が暗号文になっていることを確認済み
- 備考: iOS のタブが 7 つになったためラベルを 9pt にした（実機での見え方の確認は人間）。生年月日の入力は iOS ではテキスト（YYYY-MM-DD）

### T-312 履歴書の PDF 出力 ［AI］ ✅ 完了（2026-09-11）
- 依存: T-311
- 内容: 履歴書を JIS 様式に近い A4・2 ページ（1 枚目: 氏名・住所・学歴職歴 / 2 枚目: 免許資格・志望動機など）で PDF にする。
  HTML は `@shared/resume-document` で Web / iOS 共通に作り、Web はブラウザの印刷画面（「PDF に保存」）、
  iOS は `expo-print`（A4・余白 12mm）で PDF を作って `expo-sharing` の共有シートで保存・送信する。
  今の履歴書 / 将来の履歴書（目標の行を網掛け・「（目標）」付き）をタブごとに出せる。写真欄は枠だけ
- 完了条件: Web / モバイルとも `tsc` がクリーン、Web の lint・本番ビルドと iOS の JS バンドルが成功。
  サンプルデータで A4・2 ページの PDF になること、入力文字が HTML としてエスケープされることを確認。
  Web のボタンから印刷処理が呼ばれ、PDF の既定ファイル名（履歴書_YYYY-MM-DD）が付くことを確認済み
- 備考: iOS 実機での PDF の見え方（明朝体・余白）の確認は人間

### T-313 履歴書の写真 ［AI+人］
- 依存: T-312
- 内容: 写真のアップロード（Web はファイル選択、iOS は写真ライブラリ）と非公開ストレージへの保存を追加し、PDF の写真欄に載せる
- 完了条件: コードとテストは AI。印刷しての体裁確認は人間

### T-314 履歴書の見本（入力がその場で反映される JIS 様式の表示） ［AI］ ✅ 完了（2026-09-11）
- 依存: T-312
- 内容: PDF と同じ HTML（`@shared/resume-document`）を画面上の見本として出す。保存前のプロフィールと入力中の行
  （円グラフの「新しい予定」と同じく破線）を差し込み、打つたびに見本が変わる。Web は時間割の円グラフと同じく左に固定
  （外枠は一度だけ読み込み、本文だけを差し替えてちらつかせない）、iOS は「見本を見る」で全画面のモーダル
  （`react-native-webview`、A4 幅で描いて画面幅に縮め、ピンチで拡大）。将来の履歴書タブの一覧形式の見本はこの見本に置き換えた
- 完了条件: Web / モバイルとも `tsc` がクリーン、Web の lint・本番ビルドと iOS の JS バンドルが成功。
  本番とは別の使い捨て API で、保存前のプロフィールが見本に出る・キャンセルで戻る・入力中の行が破線で入り保存で通常の行になる・
  将来の目標が網掛け＋破線で入る、を画面から確認済み。PDF の体裁（A4・2 ページ）が変わらないことも確認
- 備考: iOS 実機でのモーダルの見え方の確認は人間

### T-315 利用フローに沿った画面構成（今日の一歩を実施のハブにする） ［AI］ ✅ 完了（2026-09-13）
- 依存: T-308, T-310, T-311
- 内容: [readme 第3章](../../readme.md#3-基本フロー) の利用フローどおりに画面を組み替えた。
  - API: `GET /compass/today` が `kind`（task / compare / breakdown / empty）を返す（`App\Services\TodayStepService`）。
    実施できる葉が無ければ二択、優先度が確定していれば細分化を今日の一歩として案内する。
    優先度の確定は「active なルートの全ペアを一度でも比べたか」（`ComparisonPairSelector::isRankingSettled`）
  - 通知: 実施できる葉が無くても二択・細分化として送る。`notifications` に `kind` を足し、
    二択のために `task_id` を NULL 許容へ。文面は `App\Services\Push\PushMessage` に集約
  - Web / iOS: 「今日の一歩」1 画面で実施 → 二択 → 細分化のループを回す。隙間時間 15 分の残りを帯で出し、
    残っていれば次の一歩へ、使い切ったら「今日はここまで」。二択・細分化はメニュー/タブから外し
    （URL・画面は保持）、ナビゲーションを「進む（今日の一歩・やりたいこと）」「振り返る（ダッシュボード・時間割・履歴書）」の 2 区分に
  - watchOS: 二択・細分化のときは「iPhoneで今日の一歩を選んでください」と案内（Watch は実施する一歩だけを扱う）
- 完了条件: API のテスト 157 件（今日の一歩の kind・通知の kind を追加）が通り、Web / モバイルとも `tsc` がクリーン、
  Web の lint・本番ビルドが成功
- 備考: Swift（Watch）の変更は Xcode でのビルド確認が必要（この環境に Swift ツールチェーンがない）

---

## Phase 3.5: ソーシャルログイン

方針: 各端末で Google / Apple にログインして得た **ID トークン**を API が検証し、既存と同じ Sanctum トークンを発行する。
ログイン後の仕組みは変えない（Watch は iPhone のログインを引き継ぐので対応不要）。
既存のメール登録ユーザーとは、プロバイダがメール確認済み（`email_verified`）と保証する場合に限り、同じメールアドレスのアカウントへ紐付ける。
`users.password` は既に NULL 可（readme 19.1節）。

### T-350 API: Google ID トークンでのログイン ［AI］
- 依存: T-101, T-904
- 内容: `POST /auth/google`（`id_token` を受け取り、署名・`aud`（Web / iOS / Android のクライアント ID）・`iss`・有効期限を検証）。
  ユーザーとプロバイダの対応表（例: `social_accounts`: user_id, provider, provider_user_id UNIQUE）を追加し、見つからなければ作成、
  メール確認済みなら既存ユーザーへ紐付け。クライアント ID は `.env`（`GOOGLE_CLIENT_IDS`）で注入し、`.env.example` に取得手順を書く
- 完了条件: 署名不正・`aud` 違い・期限切れ・未確認メールの紐付け拒否を含む Feature テストが通る

### T-351 Web: 「Googleでログイン」ボタン ［AI+人］
- 依存: T-350
- 内容: Google Identity Services のボタンをログイン / 新規登録画面に追加し、得た ID トークンを T-350 へ送る。文言は `@shared/copy` に追加
- 完了条件: コードは AI。本番ドメインを OAuth クライアントの承認済みオリジンに登録し、実ブラウザでログインできることの確認は人間

### T-352 モバイル: Google ログイン ［AI+人］
- 依存: T-350
- 内容: ネイティブのログイン部品（`@react-native-google-signin/google-signin` 等）を導入し、ID トークンを T-350 へ送る
- 完了条件: コードは AI。**Expo Go では動かない**ため開発ビルド（Xcode / Android Studio）での確認は人間
- 備考: Expo Go ではボタンを出さない（ネイティブモジュールが無い環境で落ちないようにする。src/watch/sync.ts と同じ遅延 require の扱い）

### T-353 Sign in with Apple（API + iOS） ［AI+人］
- 依存: T-350
- 内容: `POST /auth/apple`（Apple の ID トークンを JWKS で検証）と iOS の `expo-apple-authentication`。
  App Store 審査ガイドライン 4.8 で、Google などの外部ログインを付けたアプリには同等のログイン手段が求められるため、T-352 と同時にリリースする
- 完了条件: コードとテストは AI。Apple Developer での Sign in with Apple 有効化と実機確認は人間（T-901）

---

## Phase 4 以降（着手時に詳細化）

- T-401 AI おすすめ（Claude API で文脈付き提案文を生成）［AI］
- T-402 Google Calendar 連携（実際の予定を週間スケジュールに重ねて隙間を補正）［AI+人: OAuth 設定］
- T-405 特定日だけの例外予定（旅行・出張など。週間スケジュールを日付で上書き）［AI］
- T-406 w4（所要時間補正）有効化。隙間の長さに収まるタスクを優先して提案する［AI］
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
| T-904 | Google Cloud Console で OAuth 同意画面を作成し、Web / iOS / Android の OAuth クライアント ID を発行（Web は本番ドメインを承認済みオリジンに登録） | T-350〜T-352 |

---

## AI へ依頼するときのテンプレート

```
readme.md と docs/tasks/task.md を読んでください。
T-XXX を実装してください。
- 完了条件を満たすこと
- テストを書き、通ることを確認すること
- 既存のディレクトリ構成・コーディング規約に従うこと
```
