# 人生のコンパス（Life Compass）

> **迷う時間を、進む時間へ。**

## コンセプト

「人生のコンパス」は、ToDo管理アプリではありません。

やるべきことを管理するのではなく、

**"今日、最初の一歩を決める"**

ことを支援する意思決定アプリです。

従来のToDoアプリは「何が残っているか」を管理しますが、
人生のコンパスは「今の自分にとって最も価値のある行動」を提案します。

---

# 開発理念

## 入力より、選ぶ。

ユーザーに求める入力は極限まで少なくします。

### 従来のToDo

- タイトル
- カテゴリ
- 優先度
- 期限
- タグ
- メモ
- 繰り返し
- 通知

### 人生のコンパス

```
タイトルだけ登録

↓

二択で選ぶ

↓

今日のおすすめが届く
```

---

# ターゲット

- やりたいことが多い人
- 優先順位が決められない人
- ToDoアプリが続かなかった人
- 自己成長したい人
- ライフワークバランスを大切にしたい人

---

# 基本機能

## 1. やりたいこと登録

登録可能件数

```
最大100件
```

登録項目

|項目|必須|
|----|----|
|タイトル|○|

例

- Reactを勉強する
- 子どもと遊ぶ
- コーヒー新メニューを考える
- ジムニーでキャンプ
- 情報処理安全確保支援士の勉強

最初はタイトルのみ。

---

## 2. 二択による優先順位決定

画面

```
どちらが今重要？

────────────

React勉強

VS

家族旅行

────────────

◀ 左

▶ 右

あとで決める
```

1〜2秒で回答可能。

比較履歴から優先順位を学習する。

---

## 3. ランキング生成

内部アルゴリズム

候補

- Elo Rating
- TrueSkill
- Merge Sort
- Quick Sort

ランキング例

```
1 React勉強
2 家族旅行
3 コーヒー新メニュー
4 ジムニーキャンプ
5 資格取得
```

---

## 4. 今日のコンパス

ホーム画面

```
🧭 今日の一歩

React勉強

15分

開始する
```

表示するのは一つだけ。

---

# Apple Watch連携

## 毎朝通知

例

```
🧭 今日の一歩

Reactを15分やりませんか？

[開始]

[あとで]
```

通知は1日1回。

大量通知はしない。

---

## Watchから開始

開始を押すと

```
15:00

React勉強

■■■■□□□□

残り14:59
```

タイマー開始。

---

## タイマー終了

```
👏 お疲れ様！

できた？

😊 完了

😅 少しだけ

❌ また今度
```

入力はワンタップ。

---

## 少しだけ

例

```
15分予定

↓

7分実施
```

記録

```
7分達成
```

100点主義にしない。

---

## 今日できなかった

```
今日は無理
```

↓

提案

```
5分だけやりますか？

YES

NO
```

行動ハードルを下げる。

---

# おすすめ生成

おすすめは順位だけで決めない。

スコア例

```
おすすめスコア

=

優先順位

+

最近やっていない補正

+

所要時間

+

締切

+

習慣化補正
```

将来的にAIで改善可能。

---

# 完了記録

記録項目

- 完了
- 一部完了
- 未実施

それだけ。

---

# 将来追加する入力

必要になったらだけ聞く。

## 所要時間

```
15分

30分

1時間
```

## 期限

```
今日

今週

今月

なし
```

入力は任意。

---

# ダッシュボード

表示内容

- 今日のおすすめ
- TOP10
- 今週完了数
- 比較回数
- 継続日数

情報は最小限。

---

# AIコンパス（将来）

AIが提案

例

```
今日は休日です。

最近勉強が続いています。

今日は家族との時間がおすすめです。
```

---

# Google Calendar連携

予定の空き時間を取得。

例

```
18:30〜19:00

空いています。

React15分がおすすめです。
```

---

# Appleヘルス連携

取得可能データ

- 歩数
- 睡眠
- ワークアウト

例

```
睡眠不足

↓

今日は軽めのタスクがおすすめ
```

---

# 天気連携

例

```
晴れ

↓

キャンプ

散歩

洗車
```

雨

```
読書

勉強

資格取得
```

---

# 家族共有（将来）

共有内容

```
今週やりたいこと

今週終わったこと
```

夫婦でも利用可能。

---

# 年間レビュー

表示

```
今年最も選ばれたこと

React

家族

健康

資格
```

価値観の変化を可視化。

---

# ディレクトリ構成

```
docker_task_management/
├── app/                  アプリケーション本体
│   ├── web/              React + Vite フロントエンド
│   └── api/              Laravel API バックエンド
├── docs/                 設計資料・ドキュメント
├── platform/             インフラ定義（Docker）
│   ├── docker-compose.yml
│   └── api.Dockerfile
└── readme.md
```

- **app/** … 実際に動くコードを置く場所
- **docs/** … 仕様書・設計メモを置く場所
- **platform/** … Docker などの実行基盤の定義を置く場所

---

# Docker開発環境

システムは Docker 上で稼働します。

構成は `platform/docker-compose.yml` に定義しています。

## コンテナ構成

|サービス|役割|ポート|
|----|----|----|
|web|React + Vite フロントエンド|3000|
|api|Laravel API|8000|
|scheduler|Laravel スケジューラ（毎朝通知など）|-|
|db|MySQL 8|3306|

```
ブラウザ
  ↓ :3000
web（React + Vite）
  ↓ :8000
api（Laravel）  ←─ scheduler（php artisan schedule:work）
  ↓ :3306
db（MySQL）
```

## 起動方法

```bash
# 起動（初回や api.Dockerfile 変更時は --build）
docker compose -f platform/docker-compose.yml up -d --build

# 状態確認
docker compose -f platform/docker-compose.yml ps

# 停止
docker compose -f platform/docker-compose.yml down
```

## アクセス先

- フロントエンド: http://localhost:3000
- API: http://localhost:8000
- MySQL: localhost:3306（DB名 `life_compass` / ユーザー `app` / パスワード `secret`）

## 補足

- `app/web` に React + Vite、`app/api` に Laravel のプロジェクトを配置済みです
- api / scheduler コンテナは `platform/api.Dockerfile`（composer / pdo_mysql 入り）でビルドされます
- DB のデータは Docker ボリューム `db-data` に永続化されます
- 通知送信はキュー専用コンテナを設けず、scheduler コンテナ内で同期実行します

---

# 技術構成

## フロントエンド

- React
- Vite（Web、SPA）
- React Native（Expo）

---

## モバイル

- iOS
- Android

---

## Watch

- watchOSアプリ
- Apple Watch Complication
- Live Activity（将来）
- Interactive Notification

---

## バックエンド

Laravel API

構成

```
Laravel

↓

REST API

↓

MySQL
```

将来的にGraphQL対応可能。

---

## データベース

MySQL

主要テーブル

### users

- id
- name
- email

### tasks

- id
- user_id
- title
- duration
- deadline
- rating
- status

### comparisons

- id
- winner_task_id
- loser_task_id
- compared_at

### task_logs

- id
- task_id
- started_at
- finished_at
- result
- elapsed_time

### notifications

- id
- user_id
- scheduled_at
- delivered_at

---

# 通知基盤

- Firebase Cloud Messaging
- Apple Push Notification Service

---

# 認証

対応予定

- Apple
- Google
- WordPress SSO
- メールアドレス

---

# 開発ロードマップ

## Phase1

- タスク登録
- 二択比較
- ランキング生成

---

## Phase2

- 今日のおすすめ
- プッシュ通知
- 完了記録

---

## Phase3

- Apple Watch
- タイマー
- 通知操作

---

## Phase4

- AIおすすめ
- カレンダー
- ヘルスケア連携
- 天気連携

---

## Phase5

- 家族共有
- 年間レビュー
- Web版

---

# キャッチコピー

候補

- 今日の一歩が、未来を変える。
- 人生に、コンパスを。
- 迷う時間を、進む時間へ。
- 選ぶだけで、進むべき道が見えてくる。
- 今日のあなたに、ちょうどいい一歩を。

---

# このアプリが提供する価値

人生のコンパスは、
「やることを増やすアプリ」ではありません。

**迷いを減らし、最初の一歩を踏み出すためのアプリ**です。

毎日たった一つの提案。

たった15分の行動。

その積み重ねが、人生を少しずつ望む方向へ導いていく。

**人生のコンパスは、あなたの価値観を学び、今日の一歩を示すパートナーです。**