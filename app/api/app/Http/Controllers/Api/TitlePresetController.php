<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTitlePresetRequest;
use App\Http\Resources\TitlePresetResource;
use App\Models\TitlePreset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TitlePresetController extends Controller
{
    /**
     * 予定タイトルの「よく使う項目」。
     * 既定の項目（削除不可）を先に、そのあとユーザーが登録した項目を登録順に並べて返す。
     */
    public function index(Request $request)
    {
        $defaults = array_map(
            fn (string $label) => ['id' => null, 'label' => $label, 'is_default' => true],
            TitlePreset::DEFAULT_LABELS,
        );

        // 既定の項目は後から増えることがある。増える前に同じ名前を登録していたユーザーに
        // 二重に出さないよう、既定と重なるものはここで落とす。
        $own = $request->user()->titlePresets()
            ->whereNotIn('label', TitlePreset::DEFAULT_LABELS)
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => [...$defaults, ...TitlePresetResource::collection($own)->resolve()],
        ]);
    }

    public function store(StoreTitlePresetRequest $request)
    {
        $preset = $request->user()->titlePresets()->create([
            'label' => $request->validated('label'),
        ]);

        return TitlePresetResource::make($preset)->response()->setStatusCode(201);
    }

    public function destroy(TitlePreset $titlePreset)
    {
        Gate::authorize('delete', $titlePreset);

        $titlePreset->delete();

        return response()->noContent();
    }
}
