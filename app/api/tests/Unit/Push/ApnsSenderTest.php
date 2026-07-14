<?php

namespace Tests\Unit\Push;

use App\Models\DeviceToken;
use App\Models\PushNotification;
use App\Models\Task;
use App\Models\User;
use App\Services\Push\ApnsSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ApnsSenderTest extends TestCase
{
    use RefreshDatabase;

    private function configureApns(): void
    {
        config([
            'push.apns.key_id' => 'TESTKEYID',
            'push.apns.team_id' => 'TESTTEAMID',
            'push.apns.bundle_id' => 'com.example.lifecompass',
            'push.apns.private_key_path' => __DIR__.'/../../Fixtures/apns-test-key.p8',
            'push.apns.production' => false,
        ]);
    }

    public function test_skips_when_not_configured(): void
    {
        config(['push.apns.private_key_path' => null]);

        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $deviceToken = DeviceToken::factory()->for($user)->create(['platform' => 'ios']);
        $notification = PushNotification::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'scheduled_at' => now(),
        ]);

        Http::fake();

        $sent = (new ApnsSender())->send($deviceToken, $notification);

        $this->assertFalse($sent);
        Http::assertNothingSent();
    }

    public function test_sends_request_to_sandbox_host_with_expected_payload(): void
    {
        $this->configureApns();

        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['title' => 'Reactを勉強する']);
        $deviceToken = DeviceToken::factory()->for($user)->create(['platform' => 'ios', 'token' => 'device-token-abc']);
        $notification = PushNotification::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'scheduled_at' => now(),
        ]);

        Http::fake(['api.sandbox.push.apple.com/*' => Http::response('', 200)]);

        $sent = (new ApnsSender())->send($deviceToken, $notification);

        $this->assertTrue($sent);
        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.sandbox.push.apple.com/3/device/device-token-abc'
                && $request['aps']['alert']['body'] === 'Reactを勉強する を始めませんか？'
                && $request->hasHeader('apns-topic', 'com.example.lifecompass');
        });
    }
}
