# Laravel API の実行環境（FrankenPHP）。ソースは compose の volumes でマウントする。
# 配信は FrankenPHP の php-server（ワーカーではない通常のモード）で、ポート 8000 の HTTP だけを待ち受ける
FROM dunglas/frankenphp:1.14.0-php8.3.37-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip default-mysql-client \
    && install-php-extensions pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

EXPOSE 8000

CMD ["frankenphp", "php-server", "--listen", ":8000", "--root", "public/"]
