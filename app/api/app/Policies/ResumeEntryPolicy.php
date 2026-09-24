<?php

namespace App\Policies;

use App\Models\ResumeEntry;
use App\Models\User;

class ResumeEntryPolicy
{
    public function update(User $user, ResumeEntry $resumeEntry): bool
    {
        return $user->id === $resumeEntry->user_id;
    }

    public function delete(User $user, ResumeEntry $resumeEntry): bool
    {
        return $user->id === $resumeEntry->user_id;
    }
}
