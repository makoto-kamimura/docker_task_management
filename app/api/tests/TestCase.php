<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // コンテナの実環境変数（DB_CONNECTION=mysql 等）は phpunit.xml の <env> より
        // 優先されるため、テストが本番DBに向き RefreshDatabase が全データを消しうる。
        // 実行方法を問わず、sqlite :memory: 以外への接続を検知したら即中断する。
        if (config('database.default') !== 'sqlite'
            || config('database.connections.sqlite.database') !== ':memory:') {
            throw new RuntimeException(
                'テストが sqlite :memory: 以外に接続しています。実DB破壊を防ぐため中断しました。'
                .' コンテナ内では `env -u DB_CONNECTION -u DB_DATABASE -u APP_ENV php artisan test` で実行してください。'
            );
        }
    }
}
