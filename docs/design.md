# 人生のコンパス（Life Compass）設計書

最終更新: 2026-07-14

企画・コンセプトは [readme.md](../readme.md) を参照。本書は実装のための技術設計を定義する。

---

## 1. システム全体構成

```
┌─────────────┐  ┌─────────────────┐  ┌──────────────┐
│  Web (SPA)   │  │  iOS / Android    │  │  Apple Watch  │
│  React+Vite  │  │  React Native     │  │  SwiftUI      │
│              │  │  (Expo)           │  │  (ネイティブ)  │
└──────┬──────┘  └────────┬────────┘  └──────┬───────┘
       │                  │      WatchConnectivity│
       │                  │◀────────────────────▶│
       │ REST/JSON        │ REST/JSON             │ REST/JSON(直接も可)
       ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────┐
│                  Laravel API (REST)                   │
│   認証: Sanctum / ランキング: Elo / おすすめスコア計算   │
└──────┬───────────────────────────────┬──────────────┘
       │                               │
       ▼                               ▼
┌─────────────┐              ┌──────────────────────┐
│   MySQL 8    │              │ 通知基盤               │
│              │              │ FCM(Android) / APNs(iOS│
└─────────────┘              │ ・watchOS)             │
                              └──────────────────────┘
```

開発環境は Docker（[platform/docker-compose.yml](../platform/docker-compose.yml)）で
web / api / db の 3 コンテナを稼働させる。
モバイル・Watch はネイティブビルドが必要なため Docker 外（Expo / Xcode）で開発する。

---

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|----|----|----|
| Web フロントエンド | React 19 + Vite + TypeScript | SPA。ログイン後利用が前提で SEO 不要のため SSR(Next.js)は採用しない |
| モバイル | React Native (Expo) + TypeScript | iOS / Android 共通 |
| watchOS | SwiftUI + WidgetKit | **ネイティブ実装（3章参照）** |
| API | Laravel 11 (PHP 8.3) | REST。将来 GraphQL 追加可 |
| DB | MySQL 8.4 | Docker ボリュームで永続化 |
| 認証 | Laravel Sanctum | トークン認証。Apple / Google Sign-In は Phase 2 以降 |
| 通知 | APNs / FCM | 1 日 1 回の「今日の一歩」通知 |
| 状態管理(Web/RN) | TanStack Query + Zustand | サーバー状態とUI状態を分離 |

---

## 3. watchOS 構成の設計方針（調査結果）

### 3.1 調査で確認した事実

1. **React Native / Expo は watchOS の UI をレンダリングできない。**
   Watch アプリの UI は SwiftUI（または WatchKit）によるネイティブ実装が必須。
2. Expo プロジェクトに watch ターゲットを同居させる手法として
   **expo-apple-targets（@bacons/apple-targets）** が確立しており、
   SwiftUI 製 watchOS アプリを Expo の prebuild フローに組み込める。
   ただしこの構成の watch アプリはペアリングされた iOS アプリが必要（単独配布不可）。
3. iPhone ↔ Watch のデータ連携は **WatchConnectivity** フレームワークを使い、
   RN 側からは **react-native-watch-connectivity** ライブラリでブリッジできる。
4. **EAS（Expo のクラウドビルド）は watch ターゲットを標準サポートしていない**ため、
   watch を含むビルドはローカル Xcode ビルドを基本とする。
5. watchOS 26 時点の周辺機能:
   - コンプリケーションは ClockKit ではなく **WidgetKit** で実装する（現行の標準）
   - iOS アプリの **Live Activity は watchOS の Smart Stack に自動表示**される
     （watch 側の追加実装ほぼ不要 → readme の「Live Activity（将来）」は低コストで実現可）
   - **RelevanceKit** で睡眠・時刻・位置などの文脈に応じた Smart Stack 表示が可能
     （「今日のコンパス」との相性が良い）

### 3.2 採用構成

```
Expo プロジェクト (app/mobile)
├── React Native アプリ本体（iOS / Android）
└── targets/watch/          ← expo-apple-targets で追加
    ├── SwiftUI watchOS アプリ
    │   ├── 今日の一歩 表示
    │   ├── タイマー（開始/終了/結果入力）
    │   └── 完了記録の送信
    └── WidgetKit コンプリケーション
```

- **UI**: SwiftUI。画面は「今日の一歩」「タイマー」「結果入力」の 3 つのみ
- **データ取得**: 基本は WatchConnectivity で iPhone から受け取る。
  タイマー実行と結果送信は Watch から API へ直接 POST もできるようにし、
  iPhone が近くになくても計測が完結する設計とする（URLSession 使用）
- **通知**: APNs のインタラクティブ通知（[開始][あとで] アクション付き）。
  iPhone で受けた通知は未読時に Watch へ自動転送される標準挙動を利用
- **コンプリケーション**: WidgetKit で「今日の一歩」タイトルを表示
- **ビルド**: watch を含む iOS ビルドはローカル Xcode。Android と watch なし iOS は EAS 可

### 3.3 readme からの変更点

| readme の記載 | 本設計 |
|----|----|
| Watch も React Native の文脈で記載 | Watch は SwiftUI ネイティブ（RN では不可能） |
| Apple Watch Complication | WidgetKit で実装（ClockKit は非推奨） |
| Live Activity（将来） | iOS 側の実装だけで Smart Stack に自動表示されるため前倒し可 |
| フロントエンド: Next.js | React + Vite の SPA に変更（SEO 不要のため） |

---

## 4. ディレクトリ構成（設計後）

```
docker_task_management/
├── app/
│   ├── web/        React + Vite SPA
│   ├── api/        Laravel API
│   └── mobile/     Expo (React Native) + targets/watch (SwiftUI)
├── docs/
│   ├── design.md   本書
│   └── task.md     タスク分解
├── platform/
│   └── docker-compose.yml
└── readme.md       企画書
```

※ `app/mobile` は本書で追加。Docker 対象外（Expo/Xcode で開発）。

---

## 5. データベース設計

### users

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | NULL（SSO のみのユーザーは NULL） |
| notification_time | TIME | DEFAULT '07:00'（毎朝通知の時刻） |
| created_at / updated_at | TIMESTAMP | |

### tasks（やりたいこと）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK → users.id |
| title | VARCHAR(200) | NOT NULL（登録必須はこれだけ） |
| duration_minutes | SMALLINT UNSIGNED | NULL（任意: 15/30/60） |
| deadline_type | ENUM('today','week','month','none') | DEFAULT 'none' |
| rating | DOUBLE | DEFAULT 1500（Elo レート） |
| status | ENUM('active','archived') | DEFAULT 'active' |
| last_done_at | TIMESTAMP | NULL（「最近やっていない」補正用） |
| created_at / updated_at | TIMESTAMP | |

制約: ユーザーあたり active タスク最大 100 件（アプリ層でバリデーション）。

### comparisons（二択の履歴）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK |
| winner_task_id | BIGINT UNSIGNED | FK → tasks.id |
| loser_task_id | BIGINT UNSIGNED | FK → tasks.id |
| compared_at | TIMESTAMP | NOT NULL |

### task_logs（実施記録）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| task_id | BIGINT UNSIGNED | FK |
| started_at | TIMESTAMP | NOT NULL |
| finished_at | TIMESTAMP | NULL |
| result | ENUM('done','partial','skipped') | NULL |
| elapsed_seconds | INT UNSIGNED | NULL（「少しだけ」= 予定未満の実績を記録） |
| source | ENUM('web','mobile','watch') | DEFAULT 'mobile' |

### notifications（通知履歴）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK |
| task_id | BIGINT UNSIGNED | FK（提案したタスク） |
| scheduled_at | TIMESTAMP | NOT NULL |
| delivered_at | TIMESTAMP | NULL |

### device_tokens（プッシュ通知先）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK |
| platform | ENUM('ios','android','watchos') | NOT NULL |
| token | VARCHAR(255) | NOT NULL, UNIQUE |

---

## 6. API 設計（REST）

ベース URL: `/api/v1`。認証は Sanctum の Bearer トークン。

| メソッド | パス | 内容 |
|----|----|----|
| POST | /auth/register | 会員登録（name, email, password） |
| POST | /auth/login | ログイン → トークン発行 |
| POST | /auth/logout | ログアウト |
| GET | /tasks | タスク一覧（rating 降順 = ランキング） |
| POST | /tasks | タスク登録（title のみ必須、100 件超はエラー） |
| PATCH | /tasks/{id} | 更新（duration, deadline_type, status 等） |
| DELETE | /tasks/{id} | 削除 |
| GET | /comparisons/next | 次に比較すべきペアを返す（6.1 参照） |
| POST | /comparisons | 比較結果を登録 → 両タスクの Elo を更新 |
| GET | /compass/today | 今日の一歩（おすすめ 1 件 + 所要時間） |
| POST | /task-logs | 実施記録（started_at, result, elapsed_seconds, source） |
| GET | /dashboard | 今日のおすすめ / TOP10 / 今週完了数 / 比較回数 / 継続日数 |
| POST | /devices | デバイストークン登録 |

### 6.1 比較ペアの選定

「比較回数が少ない」「rating が近い」ペアを優先して返す。
これにより少ない回答数でランキングが収束する。
「あとで決める」はスキップとして記録せず、単に別ペアを返す。

---

## 7. ランキングアルゴリズム

**Elo Rating を採用**（readme の候補: Elo / TrueSkill / Merge Sort / Quick Sort から選定）。

- 選定理由: 1 回の二択ごとに逐次更新でき「あとで決める」（未回答）を許容する。
  ソート系は全ペア比較の完了が前提になるため不適。
  TrueSkill は不確実性も扱えるが実装が重く、個人内ランキングには過剰
- 初期値 1500、K 係数 32（比較 10 回未満のタスクは K=64 で早く収束させる）
- 更新式: `R' = R + K × (S − E)`、`E = 1 / (1 + 10^((R_opponent − R) / 400))`

## 8. おすすめスコア（今日のコンパス）

```
score = w1 × rating正規化(0-1)
      + w2 × 最近やっていない補正(last_done_at からの経過日数, 上限14日)
      + w3 × 締切補正(today=1.0, week=0.6, month=0.3, none=0)
      + w4 × 所要時間補正(空き時間内に収まるものを優遇 ※Phase4)
初期重み: w1=0.5, w2=0.2, w3=0.3, w4=0（カレンダー連携後に有効化）
```

最高スコアの 1 件だけを返す。同点時は rating が高い方。

## 9. 通知設計

- Laravel のスケジューラ（`schedule:work` コンテナ or cron）が毎分、
  `users.notification_time` に一致するユーザーの「今日の一歩」を計算し
  APNs / FCM へ送信、`notifications` に記録する
- 1 ユーザー 1 日 1 通のみ（notifications テーブルで重複防止）
- iOS はカテゴリ付きインタラクティブ通知（[開始] [あとで]）。
  [開始] は Watch / iPhone でタイマー画面を直接起動する

## 10. 認証

- Phase 1: メールアドレス + パスワード（Sanctum トークン）
- Phase 2 以降: Sign in with Apple / Google（Laravel Socialite）
- WordPress SSO は優先度低（readme 記載のみ、設計対象外）

## 11. 非機能要件

- タスク上限 100 件 / ユーザー
- 二択回答は 1 リクエスト 200ms 以内に応答（Elo 更新は同期で十分軽い）
- 通知は 1 日 1 回厳守（企画の核。実装でも二重送信防止を必須とする）
- 個人データのみでスタート（家族共有は Phase 5 で別途設計）

## 12. 開発フェーズと本書の対応

| Phase | 内容 | 本書の関連章 |
|----|----|----|
| 1 | タスク登録 / 二択比較 / ランキング | 5, 6, 7 |
| 2 | 今日のおすすめ / プッシュ通知 / 完了記録 | 8, 9 |
| 3 | Apple Watch / タイマー / 通知操作 | 3 |
| 4 | AI おすすめ / カレンダー / ヘルスケア / 天気 | 8（w4 有効化）+ 追加設計 |
| 5 | 家族共有 / 年間レビュー / Web 版拡張 | 追加設計 |
