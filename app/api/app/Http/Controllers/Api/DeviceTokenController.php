<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeviceTokenRequest;
use App\Models\DeviceToken;

class DeviceTokenController extends Controller
{
    public function store(StoreDeviceTokenRequest $request)
    {
        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $request->validated('token')],
            [
                'user_id' => $request->user()->id,
                'platform' => $request->validated('platform'),
            ],
        );

        return response()->json([
            'data' => [
                'id' => $deviceToken->id,
                'platform' => $deviceToken->platform,
            ],
        ], 201);
    }
}
