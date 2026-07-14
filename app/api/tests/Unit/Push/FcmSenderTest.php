<?php

namespace Tests\Unit\Push;

use App\Models\DeviceToken;
use App\Models\PushNotification;
use App\Models\Task;
use App\Models\User;
use App\Services\Push\FcmSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FcmSenderTest extends TestCase
{
    use RefreshDatabase;

    private function configureFcm(): void
    {
        config([
            'push.fcm.project_id' => 'life-compass-test',
            'push.fcm.credentials_path' => __DIR__.'/../../Fixtures/fcm-test-service-account.json',
        ]);
    }

    public function test_skips_when_not_configured(): void
    {
        config(['push.fcm.credentials_path' => null]);

        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $deviceToken = DeviceToken::factory()->for($user)->create(['platform' => 'android']);
        $notification = PushNotification::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'scheduled_at' => now(),
        ]);

        Http::fake();

        $sent = (new FcmSender())->send($deviceToken, $notification);

        $this->assertFalse($sent);
        Http::assertNothingSent();
    }

    public function test_fetches_access_token_then_sends_message(): void
    {
        $this->configureFcm();

        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['title' => 'ジムニーでキャンプ']);
        $deviceToken = DeviceToken::factory()->for($user)->create(['platform' => 'android', 'token' => 'fcm-device-token']);
        $notification = PushNotification::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'scheduled_at' => now(),
        ]);

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'fake-access-token'], 200),
            'fcm.googleapis.com/*' => Http::response(['name' => 'projects/x/messages/1'], 200),
        ]);

        $sent = (new FcmSender())->send($deviceToken, $notification);

        $this->assertTrue($sent);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'oauth2.googleapis.com/token')
            && $request['grant_type'] === 'urn:ietf:params:oauth:grant-type:jwt-bearer');

        Http::assertSent(function ($request) {
            return $request->url() === 'https://fcm.googleapis.com/v1/projects/life-compass-test/messages:send'
                && $request->hasHeader('Authorization', 'Bearer fake-access-token')
                && $request['message']['token'] === 'fcm-device-token'
                && $request['message']['notification']['body'] === 'ジムニーでキャンプ を始めませんか？';
        });
    }

    public function test_returns_false_when_token_fetch_fails(): void
    {
        $this->configureFcm();

        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $deviceToken = DeviceToken::factory()->for($user)->create(['platform' => 'android']);
        $notification = PushNotification::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'scheduled_at' => now(),
        ]);

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        $sent = (new FcmSender())->send($deviceToken, $notification);

        $this->assertFalse($sent);
    }
}
