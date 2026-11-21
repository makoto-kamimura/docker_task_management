#!/bin/sh
set -e

# .env がなければ .env.example からコピー (デモ起動用)
if [ ! -f /app/.env ]; then
  echo ".env が見つかりません。.env.example からコピーします..."
  cp /app/.env.example /app/.env
fi

# Composer 依存パッケージのインストール (vendor/ がなければ実行)
if [ ! -d /app/vendor ]; then
  echo "vendor/ が見つかりません。composer install を実行します..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# APP_KEY が未設定なら自動生成。本番はコンテナの環境変数（TASK_APP_KEY）で渡しており、
# Laravel は .env より環境変数を優先するので、そのときは .env に書かない。
if [ -z "${APP_KEY:-}" ] && ! grep -q "^APP_KEY=base64:" /app/.env 2>/dev/null; then
  echo "APP_KEY を生成します..."
  php artisan key:generate --force
fi

# 環境変数が .env のデフォルト値と異なる場合は .env を上書きする。
# php artisan serve が起動する子プロセスは親の環境変数を引き継がないため、
# .env に正しい値を書き込んでおく必要がある。
# SSO (OIDC_*・PUBLIC_BASE_URL) も同じ理由で書き写す
for _VAR in APP_ENV APP_DEBUG APP_URL DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD FRONTEND_URL \
    OIDC_ISSUER OIDC_CLIENT_ID OIDC_CLIENT_SECRET PUBLIC_BASE_URL OIDC_REQUIRE_MFA OIDC_DISPLAY_NAME OIDC_SCOPE \
    OIDC_MOBILE_REDIRECT_PREFIXES OIDC_LINK_DENY_EMAIL_DOMAINS OIDC_ALLOW_PASSWORD_FOR_SSO_ONLY; do
  _VAL="$(eval echo \"\${${_VAR}+x}\")"
  if [ -n "${_VAL}" ]; then
    _ACTUAL="$(eval echo \"\$${_VAR}\")"
    if grep -q "^${_VAR}=" /app/.env 2>/dev/null; then
      sed -i "s|^${_VAR}=.*|${_VAR}=${_ACTUAL}|" /app/.env
    else
      echo "${_VAR}=${_ACTUAL}" >> /app/.env
    fi
  fi
done

# MySQL の起動待ち
_DB_HOST="${DB_HOST:-db}"
_DB_PORT="${DB_PORT:-3306}"
echo "Waiting for MySQL (${_DB_HOST}:${_DB_PORT})..."
until mysqladmin ping -h "${_DB_HOST}" -P "${_DB_PORT}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" --skip-ssl --silent 2>/dev/null; do
  sleep 2
done
echo "MySQL is ready."

# マイグレーション挙動を MIGRATE_MODE で切り替え:
#   migrate (default) — 差分適用のみ。データ保持。
#   fresh             — 全テーブル drop → migrate:fresh --seed (初期化用)
MODE="${MIGRATE_MODE:-migrate}"

case "$MODE" in
  fresh)
    echo "MIGRATE_MODE=fresh → migrate:fresh --seed を実行します"
    php artisan migrate:fresh --seed --force
    ;;
  migrate|*)
    echo "MIGRATE_MODE=$MODE → migrate --force を実行します"
    php artisan migrate --force
    ;;
esac

# SEED_DEMO_DATA=true のときだけ、公開デモ用のアカウントとサンプルデータを入れる。
# DemoSeeder はデモユーザーのデータが空のときだけ入れるので、毎回の起動で実行してよい。
# パスワードが公開前提の値なので、公開デモ以外では有効にしない。
if [ "${SEED_DEMO_DATA:-false}" = "true" ] && [ "$MODE" != "fresh" ]; then
  echo "SEED_DEMO_DATA=true → デモ用のサンプルデータを確認します"
  php artisan db:seed --class=DemoSeeder --force
fi

php artisan config:clear

exec php artisan serve --host=0.0.0.0 --port=8000
