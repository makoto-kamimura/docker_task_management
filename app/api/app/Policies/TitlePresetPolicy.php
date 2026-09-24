<?php

namespace App\Policies;

use App\Models\TitlePreset;
use App\Models\User;

class TitlePresetPolicy
{
    public function delete(User $user, TitlePreset $titlePreset): bool
    {
        return $user->id === $titlePreset->user_id;
    }
}
