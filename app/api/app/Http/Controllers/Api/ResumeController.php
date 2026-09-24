<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateResumeProfileRequest;
use App\Http\Resources\ResumeEntryResource;
use App\Models\ResumeProfile;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * 履歴書（個人情報・自由記述と、今 / 将来の学歴・職歴・免許資格）をまとめて返す。
 */
class ResumeController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'profile' => $this->profilePayload($user),
                'entries' => ResumeEntryResource::collection(
                    $user->resumeEntries()->chronological()->get(),
                )->resolve(),
            ],
        ]);
    }

    public function updateProfile(UpdateResumeProfileRequest $request)
    {
        $user = $request->user();
        $user->resumeProfile()->updateOrCreate([], $request->validated());

        return response()->json(['data' => $this->profilePayload($user->refresh())]);
    }

    /** まだ何も入力していない人にも同じ形（全項目 null）で返し、画面側の分岐を減らす。 */
    private function profilePayload(User $user): array
    {
        $profile = $user->resumeProfile;

        return collect(ResumeProfile::fields())
            ->mapWithKeys(fn (string $field) => [$field => $profile?->{$field}])
            ->all();
    }
}
