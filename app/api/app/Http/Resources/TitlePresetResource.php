<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TitlePresetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            // 既定の項目は id を持たないので、消せるかどうかをこの値で見分ける。
            'is_default' => false,
        ];
    }
}
