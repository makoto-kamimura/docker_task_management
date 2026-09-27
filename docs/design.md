# 人生のコンパス（Life Compass）設計書

最終更新: 2026-09-13

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

### 1.1 利用フロー

画面の構成（ナビゲーションの並び・「今日の一歩」の中身）は、この流れに合わせている。

1. **登録**：やりたいことを Web またはスマートフォンから登録する
2. **通知**：所定の隙間時間に、スマートフォンのプッシュ通知からアプリを開いて「今日の一歩」を実施する（9 章）
3. **実施のループ**（8.2）：隙間時間 15 分を使い切るまで、今日の一歩が次々と切り替わる

   | 状況 | 今日の一歩 |
   |----|----|
   | 実施できるやりたいことがある | そのタスク（開始する → 完了） |
   | 15 分でできない | 別のやりたいこと（`needs_breakdown` を立てて候補から外す） |
   | 実施できるやりたいことが無くなった | **二択で選ぶ**（優先度を決めること自体を一歩にする） |
   | 優先度付けが確定した | **やりたいことの細分化**（分解すること自体を一歩にする） |
   | 実施後もまだ 15 分以内 | 改めてやりたいことから今日の一歩を選び直す |

4. **振り返り**：ダッシュボード・時間割・履歴書は、振り返るときに Web またはスマートフォンから確認する

そのため、ナビゲーションは「進む（今日の一歩・やりたいこと）」と
「振り返る（ダッシュボード・時間割・履歴書）」の 2 区分にし、
二択で選ぶ・細分化は独立したメニューではなく「今日の一歩」の中に出す（13.1）。

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
| 通知 | APNs / FCM | 週間スケジュールの隙間時間に送る「今日の一歩」通知 |
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

- **UI**: SwiftUI。画面は「今日の一歩」「タイマー」「結果入力」の 3 つのみ。
  各画面の項目・文言・操作は Web / iPhone の同じ画面とそろえる（13 章）
- **データ取得**: 基本は WatchConnectivity で iPhone から受け取る（ログイントークン・API のベース URL・
  今日の一歩とパンくず）。今日の一歩の取得、「15分でできない」、結果送信は Watch から API を直接呼べるようにし、
  iPhone が近くになくても計測が完結する設計とする（URLSession 使用）。
  ベース URL も iPhone から受け取るので、Watch は iPhone と同じサーバーを呼ぶ
- **通知**: APNs のインタラクティブ通知（[開始][あとで] アクション付き）。
  iPhone で受けた通知は未読時に Watch へ自動転送される標準挙動を利用し、
  Watch アプリも同じカテゴリ（`TODAY_COMPASS` / `START` / `LATER`）を登録して [開始] でタイマーを直接開く
- **コンプリケーション**: WidgetKit で「今日の一歩」タイトルを表示
- **Expo SDK 54 との組み合わせ**: `@bacons/apple-targets` 4.x は `@expo/prebuild-config` を直下から読むため、
  SDK 54 では `@expo/prebuild-config@~54.0.9` を devDependencies に置いて解決させている
- **ビルド**: watch を含む iOS ビルドはローカル Xcode。Android と watch なし iOS は EAS 可

### 3.3 readme からの変更点

| readme の記載 | 本設計 |
|----|----|
| Watch も React Native の文脈で記載 | Watch は SwiftUI ネイティブ（RN では不可能） |
| Apple Watch Complication | WidgetKit で実装（ClockKit は非推奨） |
| Live Activity（将来） | iOS 側の実装だけで Smart Stack に自動表示されるため前倒し可 |
| フロントエンド: Next.js | React + Vite の SPA に変更（SEO 不要のため） |
| 毎朝通知・通知は 1 日 1 回 | 週間スケジュールの**隙間時間の開始ごと**に通知（9 章）。「大量通知はしない」という企画の意図は、最小の隙間の長さと通知してよい時間帯で担保する |

---

## 4. ディレクトリ構成（設計後）

```
docker_task_management/
├── app/
│   ├── web/        React + Vite SPA
│   │   └── src/shared/   Web / モバイル共通の型・API 呼び出し・画面ロジック・文言（13 章）
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
| reminder_min_gap_minutes | SMALLINT UNSIGNED | DEFAULT 30（これより短い隙間ではリマインドしない） |
| reminder_window_start_minute | SMALLINT UNSIGNED | DEFAULT 420（7:00。通知してよい時間帯の開始） |
| reminder_window_end_minute | SMALLINT UNSIGNED | DEFAULT 1320（22:00。同・終了） |
| created_at / updated_at | TIMESTAMP | |

### tasks（やりたいこと / タスクツリー）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK → users.id |
| parent_id | BIGINT UNSIGNED | NULL, FK → tasks.id（自己参照。NULL = ルート。親削除で子孫もカスケード削除） |
| title | VARCHAR(200) | NOT NULL（登録必須はこれだけ） |
| duration_minutes | SMALLINT UNSIGNED | NULL（任意: 15/30/60） |
| deadline_type | ENUM('today','week','month','none') | DEFAULT 'none' |
| rating | DOUBLE | DEFAULT 1500（Elo レート。意味を持つのはルートのみ） |
| status | ENUM('active','archived') | DEFAULT 'active' |
| last_done_at | TIMESTAMP | NULL（「最近やっていない」補正・葉の選定用） |
| created_at / updated_at | TIMESTAMP | |

制約:
- ユーザーあたり active な**ルート**タスク最大 100 件（アプリ層でバリデーション。サブタスクは数えない）
- ツリーは最大 5 階層（[work.md](work.md) の基本構造: 人生の目標 → やりたいこと → プロジェクト → サブタスク → 今日の一歩）
- 循環防止: 自分自身・子孫を親に指定する更新は 422

### schedule_blocks（週間タイムスケジュール）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK → users.id（ユーザー削除でカスケード削除） |
| task_id | BIGINT UNSIGNED | NULL, FK → tasks.id（タスク削除で NULL。予定そのものは残す） |
| title | VARCHAR(100) | NOT NULL |
| day_of_week | TINYINT UNSIGNED | NOT NULL（0=日 〜 6=土） |
| start_minute | SMALLINT UNSIGNED | NOT NULL（0:00 からの経過分。0〜1439） |
| end_minute | SMALLINT UNSIGNED | NOT NULL（1〜1440。1440 = 24:00） |
| created_at / updated_at | TIMESTAMP | |

INDEX: (user_id, day_of_week)

制約:
- `end_minute > start_minute`（日をまたぐ予定は翌曜日ぶんを別レコードで登録する）
- 同一ユーザー・同一曜日で時間帯の重複は不可（422）。円グラフは 24 時間を塗り分け、
  塗り残しをそのまま隙間時間として扱うため、重なった予定は表現できない。
  境界の一致（前の予定の終了 = 次の予定の開始）は許容する。

日付ではなく曜日で持つ理由:
生活のリズムは週単位で繰り返す。1 週間ぶんの型を一度登録すれば以後の入力が要らず、
「隙間時間」も曜日ごとに一意に決まる。特定日だけの予定（旅行など）は本テーブルでは扱わない。

時刻を「時:分」ではなく 0:00 からの経過分で持つ理由:
円グラフの角度計算（`minute / 1440 * 360°`）と重複判定を整数比較だけで済ませられるため。

### resume_profiles（履歴書の個人情報・自由記述）

1 ユーザー 1 件（user_id UNIQUE、ユーザー削除でカスケード削除）。JIS 様式の項目を持つが、**どの項目も任意**。

| カラム | 型 | 制約 |
|----|----|----|
| name / name_kana / birth_date / gender | TEXT | NULL・暗号化 |
| postal_code / address / address_kana / phone / email | TEXT | NULL・暗号化（現住所） |
| contact_postal_code / contact_address / contact_phone | TEXT | NULL・暗号化（現住所以外の連絡先） |
| motivation / self_pr / requests | TEXT | NULL・暗号化（志望の動機 / 特技・アピールポイント / 本人希望記入欄） |
| commute_minutes | SMALLINT UNSIGNED | NULL（通勤時間・分） |
| dependents_count | TINYINT UNSIGNED | NULL（扶養家族数・配偶者を除く） |
| has_spouse / spouse_dependent | BOOLEAN | NULL（配偶者 / 配偶者の扶養義務） |

文字列の項目は Laravel の `encrypted` キャストで APP_KEY により暗号化して保存する
（DB のダンプやバックアップだけでは読めない）。**APP_KEY を変えると読めなくなる**ので、本番の `TASK_APP_KEY` は変えない。
写真は未対応（task.md T-313）。

### resume_entries（履歴書の学歴・職歴・免許資格）

| カラム | 型 | 制約 |
|----|----|----|
| id | BIGINT UNSIGNED | PK |
| user_id | BIGINT UNSIGNED | FK → users.id（カスケード削除） |
| task_id | BIGINT UNSIGNED | NULL, UNIQUE, FK → tasks.id（タスク削除で NULL。行は残す） |
| timeline | ENUM('current','future') | 今の履歴書 / なりたい将来の履歴書 |
| kind | ENUM('education','work','license') | 学歴 / 職歴 / 免許・資格 |
| year | SMALLINT UNSIGNED | NOT NULL |
| month | TINYINT UNSIGNED | NULL（年だけ書く行） |
| content | VARCHAR(200) | NOT NULL（tasks.title と同じ上限） |

INDEX: (user_id, timeline)

将来の行と「やりたいこと」:
- 将来の行を登録すると、同名の**ルートタスク**を作って task_id で結ぶ（ルート 100 件の上限にかかる場合は 422）。
  「その履歴になるために必要なタスク」はこのツリーの子として分解し、二択比較・ランキング・今日の一歩にそのまま乗る
- 将来の行の文言を変えるとタスク名も変える
- 「達成した」で timeline を current に移し、タスクを archived にする（ランキング・今日の一歩から外れる。ツリーと実施記録は残る）
- 行を消してもタスクは残す（目標として続けたい場合があるため）。タスクを消した将来の行は、タスクを作り直して結び直せる

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
| task_id | BIGINT UNSIGNED | NULL, FK（提案したタスク。二択のときは NULL。タスク削除で NULL） |
| kind | ENUM('task','compare','breakdown') | DEFAULT 'task'（提案した今日の一歩の種類。8.2） |
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
| GET | /tasks | タスク一覧（デフォルトはルートのみ・rating 降順 = ランキング。`?scope=all` でサブタスク含む全件） |
| POST | /tasks | タスク登録（title のみ必須、`parent_id` 指定でサブタスク。ルート 100 件超・6 階層目はエラー） |
| PATCH | /tasks/{id} | 更新（duration, deadline_type, status, parent_id 等。循環する parent_id は 422） |
| DELETE | /tasks/{id} | 削除（子孫もカスケード削除） |
| GET | /schedule-blocks | 週間スケジュール（既定は 1 週間ぶん全件。`?day_of_week=0〜6` で 1 曜日に絞る。day_of_week → start_minute 昇順） |
| GET | /schedule-blocks/free-slots | 指定曜日の隙間時間（`?day_of_week=0〜6`、省略時は今日の曜日。6.3 参照） |
| POST | /schedule-blocks | 予定登録（title, day_of_week, start_minute, end_minute、任意で task_id。重複は 422） |
| PATCH | /schedule-blocks/{id} | 更新（部分更新。未指定項目は既存値で重複判定する） |
| DELETE | /schedule-blocks/{id} | 削除 |
| GET | /reminder-settings | 隙間時間リマインダーの設定（最小の隙間・通知してよい時間帯） |
| PATCH | /reminder-settings | 同・更新 |
| GET | /resume | 履歴書（`profile`: 個人情報・自由記述。未入力は null / `entries`: 今と将来の行を年月順） |
| PATCH | /resume/profile | 個人情報・自由記述の更新（送った項目だけ。空文字は null） |
| POST | /resume/entries | 行の登録（timeline, kind, year, month, content）。将来の行は同名のルートタスクも作る |
| PATCH | /resume/entries/{id} | 行の中身の更新（kind, year, month, content）。将来の行はタスク名も変わる |
| DELETE | /resume/entries/{id} | 行の削除（結んだタスクは残す） |
| POST | /resume/entries/{id}/achieve | 将来の行を達成として今の履歴書へ移し、タスクを archived にする |
| POST | /resume/entries/{id}/task | タスクを消した将来の行に、ルートタスクを作り直して結ぶ |
| GET | /comparisons/next | 次に比較すべきペアを返す（6.1 参照。ルートタスクのみが対象） |
| POST | /comparisons | 比較結果を登録 → 両タスクの Elo を更新（サブタスクは 422） |
| GET | /compass/today | 今日の一歩（`kind` + タスク 1 件 + ルートからの `path`。8.2） |
| POST | /task-logs | 実施記録（started_at, result, elapsed_seconds, source） |
| GET | /dashboard | 今日のおすすめ / TOP10 / 今週完了数 / 比較回数 / 継続日数 |
| POST | /devices | デバイストークン登録 |

### 6.1 比較ペアの選定

「比較回数が少ない」「rating が近い」ペアを優先して返す。
これにより少ない回答数でランキングが収束する。
「あとで決める」はスキップとして記録せず、単に別ペアを返す。

### 6.2 タイムスケジュールの円グラフ

週の 1 曜日を選び、その 24 時間を円（ドーナツ）1 周として描く。時計の 0 時を頂点に、時計回りに 24 時間。
曜日の切り替えは画面上部の 7 つのタブ（月曜始まり）。タブには各曜日の空き時間の合計を出し、
どの曜日に余白があるかを一覧で掴めるようにする。

- **地は空き時間**: 先に 1 周ぶんのトラックを敷き、その上に予定を載せる。塗り残しがそのまま空き時間になる。
- **色はタイトル単位・週で共有**: 同じタイトルの予定（朝夕の «移動» など）は同じ色にする。
  色の割り当ては 1 週間ぶんまとめて決め、曜日を切り替えても «仕事» の色が変わらないようにする。
- **8 色**: カテゴリカル 8 色を使い、9 種類目以降は色相を増やさず
  同色 + テクスチャ（web はハッチング、モバイルは明度差）で区別する。
  9 色目以降を機械的に生成すると色覚特性によっては判別できなくなるため。
- **区切りは余白**: 隣り合う予定は線で囲まず、マーク側を 2px 削った余白で分ける。
  ただし余白 2 本ぶんより短い予定は削らない（消えてしまうため）。
- **ラベル**: web は予定 4 件以下かつ 45 分以上のスライスにだけ直接ラベルを引き出す。
  それ以上は重なって読めないので、下の一覧（凡例兼テーブル）で識別する。

### 6.3 隙間時間の算出

隙間時間はユーザーが別に登録するものではなく、**予定の塗り残しから導出**する。
登録済みの予定は同一曜日で重ならないことが保証されているため、隙間は一意に決まる。

```
隙間 = [通知してよい時間帯] − [その曜日の予定]
       ただし reminder_min_gap_minutes 未満の断片は捨てる
```

- 予定が 1 件も無い曜日は「通知してよい時間帯まるごと」が 1 つの隙間になる
- 時間帯の境界をまたぐ予定（6:00〜8:00 など）は、はみ出したぶんだけ隙間を削る
- 短すぎる断片（移動の合間など）を捨てるのは、そこで一歩を踏み出すのが現実的でないため
- 深夜が丸ごと隙間として残らないよう、通知してよい時間帯（既定 7:00〜22:00）で先に区切る

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
初期重み: w1=0.5, w2=0.2, w3=0.3, w4=0（未有効化）
```

w4 の材料（今まさに始まる隙間の長さ）は 6.3 で得られるようになったため、
外部カレンダー連携を待たずに有効化できる。ただし本書時点では未実装（w4=0）。

スコアリングは**ルートタスク単位**で行い、最高スコアの 1 件だけを選ぶ。同点時は rating が高い方。

### 8.1 葉（今日の一歩）の選定

コンパスが指すのは目的地ではなく次の一歩（[work.md](work.md) 参照）。
選ばれたルートのツリーをたどり、active な**葉ノード**を「今日の一歩」として返す。

- 葉が複数ある場合: 未実施（last_done_at が NULL）を優先 → 実施が古い順 → id 昇順
- ルートに子がなければルート自身が葉
- レスポンスにはルートから葉の親までの `path`（パンくず）を含める

### 8.2 実施できる一歩が無いときの今日の一歩

隙間時間に通知を受けて開いたのに「おすすめはありません」で終わると、そこで手が止まる。
そこで **優先度を決めること・分解すること自体を今日の一歩として案内する**（1.1 のループ）。
`GET /compass/today` は次の順に 1 件だけ決め、`kind` で何をするかを返す
（`App\Services\TodayStepService`）。

| 順 | kind | 条件 | `data` |
|----|----|----|----|
| 1 | `task` | 実施できる葉がある（8.1） | その葉 |
| 2 | `compare` | 実施できる葉が無く、優先度付けが未確定で比較ペアがある | null |
| 3 | `breakdown` | 実施できる葉が無く、優先度付けが確定している | 細分化する対象のタスク |
| 4 | `empty` | やりたいことが無い | null |

- **優先度付けの確定**: active なルートの全ペアを一度でも比べていれば確定とみなす
  （`ComparisonPairSelector::isRankingSettled`）。Elo は 1 回ごとに更新されるので、
  全ペアを 1 周した時点で順位は付いている。ルートが 1 件以下なら比べようがないので確定扱い
- **細分化の対象**: 分解待ち（`needs_breakdown`）のうち、ルートの rating が高いツリーのものから。
  同じツリー内では浅い＝大きな単位から分けるほうが進めやすいので、深さの浅い順 → id 昇順
- **15 分のループ**: 実施・二択・細分化のいずれかが終わると、その結果でこの判定が変わるため、
  画面は今日の一歩に戻って次の 1 件を受け取る。隙間時間の残り（既定 15 分。
  `@shared/today` の `SESSION_MINUTES`）は端末側で測り、残っていれば次の一歩を促し、
  使い切ったら「今日はここまで」と区切りを提案する。
  残り時間はタイマーと同じく開始時刻との差で求めるので、画面を離れてもずれない

## 9. 通知設計

**隙間時間が始まる瞬間に声をかける。** 固定時刻の朝一斉通知ではなく、
その日（曜日）の予定の切れ目に合わせて「今日の一歩」を提案する。

- Laravel のスケジューラ（`schedule:work` コンテナ or cron）が毎分
  `notifications:dispatch-free-slots` を実行する
- 各分について、まず「通知してよい時間帯」に入っているユーザーだけに絞り、
  今日の曜日の隙間時間（6.3）を求める。**その分がいずれかの隙間の開始時刻と一致したら**
  「今日の一歩」を計算して APNs / FCM へ送信し、`notifications` に記録する
- 送る内容は今日の一歩の種類（8.2）で変える。実施できる葉が無くても
  「二択で選ぶ」「細分化」を提案するので黙らない。やりたいことが 1 件も無いとき（`empty`）だけ送らない
  （文面は `App\Services\Push\PushMessage`）
- 隙間の途中では鳴らさない。開始時刻ちょうどの 1 回だけ
- 1 日の通知回数は隙間の数に等しい（予定を詰めた日は少なく、空いた日は多くなる）。
  声をかけすぎる場合は `reminder_min_gap_minutes` を上げて隙間の下限を引き上げる
- 同じ隙間に二重送信しない（`notifications` の user_id + scheduled_at の日時で重複防止）
- iOS はカテゴリ付きインタラクティブ通知（[開始] [あとで]）。
  [開始] は Watch / iPhone でタイマー画面を直接起動する

## 10. 認証

- Phase 1: メールアドレス + パスワード（Sanctum トークン）
- Phase 2 以降: Sign in with Apple / Google（Laravel Socialite）
- WordPress SSO は優先度低（readme 記載のみ、設計対象外）

## 11. 非機能要件

- タスク上限 100 件 / ユーザー
- 二択回答は 1 リクエスト 200ms 以内に応答（Elo 更新は同期で十分軽い）
- 通知は隙間の開始時刻ちょうどの 1 回だけ。同じ隙間で二重に送らないことを必須とする
  （企画の核は「急かさない」こと。隙間の途中や、短すぎる隙間では鳴らさない）
- 個人データのみでスタート（家族共有は Phase 5 で別途設計）

## 12. 開発フェーズと本書の対応

| Phase | 内容 | 本書の関連章 |
|----|----|----|
| 1 | タスク登録 / 二択比較 / ランキング | 5, 6, 7 |
| 2 | 今日のおすすめ / プッシュ通知 / 完了記録 | 8, 9 |
| 3 | Apple Watch / タイマー / 通知操作 | 3 |
| 4 | AI おすすめ / カレンダー / ヘルスケア / 天気 | 8（w4 有効化）+ 追加設計 |
| 5 | 家族共有 / 年間レビュー / Web 版拡張 | 追加設計 |

## 13. 端末間の仕様（Web / iOS / watchOS）

3 つの端末で同じ機能は**同じ振る舞い・同じ文言**にする。端末ごとの違いは「画面の大きさや入力手段の都合で
やむを得ないもの」だけに限り、下表に明記する。

### 13.1 画面と機能

| 画面・機能 | Web | iOS | watchOS |
|----|----|----|----|
| ログイン / 新規登録 | ○ | ○ | iPhone のログインを引き継ぐ |
| ログアウト | 上部メニュー右端 | 各タブのヘッダー右 | iPhone のログアウトに追従 |
| 今日の一歩（パンくず・所要時間・開始する・15分でできない） | ○ | ○ | ○ |
| 今日の一歩＝二択で選ぶ / 細分化（8.2。今日の一歩の中に出す） | ○ | ○ | —（iPhone で選ぶよう案内） |
| 隙間時間の残り（15分）と「もう一歩つづける / 今日はここまで」 | ○ | ○ | — |
| タイマー（残り時間・終了する） | ○ | ○ | ○ |
| 結果入力（完了 / 少しだけ / また今度）→ 記録後は今日の一歩へ戻る | ○ | ○ | ○ |
| やりたいこと（ツリー・子タスク追加・削除） | ○ | ○ | — |
| 二択で選ぶ（あとで決める。単独で開いたとき） | ○（←/→ キーでも選べる。`/compare`） | ○ | — |
| やりたいことの細分化（分解待ちの一覧・分解・分解完了。単独で開いたとき） | ○（`/todo`） | ○ | — |
| 時間割「週間タイムテーブル」タブ（曜日タブ・円グラフ・合計・一覧・コピー・スキマ ON/OFF・よく使う項目） | ○ | ○ | — |
| 時間割「スキマ時間設定」タブ（曜日タブ・選んだ曜日の隙間時間・リマインドの設定） | ○（`?tab=slots` で直接開ける） | ○ | — |
| 履歴書「今の履歴書」タブ（プロフィール・学歴・職歴・免許資格の登録と表示） | ○（`/resume`） | ○ | — |
| 履歴書「将来の履歴書」タブ（目標の登録・目標ごとの必要なタスク・達成・なりたい履歴書の見本） | ○（`?tab=future`） | ○ | — |
| 履歴書の PDF 出力（JIS 様式に近い A4・2 ページ。将来の履歴書は目標の行を網掛け） | ○（印刷画面から「PDF に保存」） | ○（PDF を作って共有シート） | — |
| 履歴書の見本（PDF と同じ体裁。保存前の入力と入力中の行を破線でその場に反映） | ○（左に固定） | ○（「見本を見る」でモーダル） | — |
| ダッシュボード（今日のおすすめ・今週完了数・比較回数・継続日数・ランキング） | ○ | ○ | — |
| 通知の [開始] でタイマーを開く | — | ○ | ○ |
| コンプリケーション | — | — | ○ |

- ナビゲーションは利用フロー（1.1）の 2 区分。Web のサイドメニュー・iOS のタブとも
  **進む**「今日の一歩 → やりたいこと」→ **振り返る**「ダッシュボード → 時間割 → 履歴書」の順
  （`@shared/copy` の `NAV_SECTIONS`）
- 二択で選ぶ・細分化はメニューに出さない（`FLOW_SCREENS`）。ふだんは今日の一歩の中に出るが、
  思い立ったときのために URL / 画面は残し、Web は `/compare`・`/todo` で直接開ける
  （iOS はタブに出さないだけで同じ画面を持つ）
- ランキングはダッシュボードに統合した（iOS のタブ数を抑えるため。Web の `/ranking` はダッシュボードへ転送する）
- watchOS は 3 章のとおり「今日の一歩」「タイマー」「結果入力」だけを持つ。一覧や編集を伴う画面は置かない。
  今日の一歩が二択・細分化のときは「iPhoneで今日の一歩を選んでください」と案内する

### 13.2 端末の都合で表現だけ変えているもの

| 項目 | Web | iOS | 理由 |
|----|----|----|----|
| 選択欄 | `<select>` | チップ / モーダルの一覧 | RN に `<select>` がない |
| 予定タイトルの候補 | 入力欄の下にドロップダウン | 入力欄の下にチップ | 同じ絞り込み（`titleSuggestions`）を端末の部品で出す |
| 円グラフの直接ラベル・吹き出し | あり | なし（一覧で識別） | 小さいリングでは文字が潰れ、タッチにはホバーがない（6.2） |
| 9 色目以降の区別 | ハッチング | 明度差 | 6.2 |
| 削除の確認 | `window.confirm` | `Alert.alert` | 文言は同じ |
| 履歴書の PDF | ブラウザの印刷画面（送信先「PDF に保存」） | `expo-print` で A4 の PDF を作り共有シート | どちらも同じ HTML（`@shared/resume-document`）から作る |
| 履歴書の見本 | 入力欄の左に固定（時間割の円グラフと同じ置き方） | 「見本を見る」で全画面のモーダル（`react-native-webview`、ピンチで拡大） | 横に並べる幅がない |

### 13.3 実装上の決まり

- Web とモバイルの型・API 呼び出し・キャッシュの取り直し範囲・画面ロジック・文言は
  `app/web/src/shared/` に 1 か所だけ置き、両方から `@shared/*` で読む（詳細は同ディレクトリの README）
- watchOS（Swift）はこれを読めないので、既定の所要時間（15 分）・結果の選択肢・文言を
  `app/mobile/targets/_shared/`（`Models.swift` / `Copy.swift`）に写している。どちらかを変えるときは両方直す
- タイマーの残り時間は 1 秒ごとの減算ではなく開始時刻との差で求める（3 端末とも）。
  画面を離れたりバックグラウンドに回ったりしても計測がずれない
