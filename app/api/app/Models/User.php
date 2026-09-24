<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'reminder_min_gap_minutes',
        'reminder_window_start_minute',
        'reminder_window_end_minute',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'reminder_min_gap_minutes' => 'integer',
            'reminder_window_start_minute' => 'integer',
            'reminder_window_end_minute' => 'integer',
        ];
    }

    /** active な「やりたいこと」（ルート）の上限。サブタスクは数えない（design.md 5 章）。 */
    public const MAX_ACTIVE_ROOT_TASKS = 100;

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function hasReachedRootTaskLimit(): bool
    {
        return $this->tasks()
            ->whereNull('parent_id')
            ->where('status', 'active')
            ->count() >= self::MAX_ACTIVE_ROOT_TASKS;
    }

    public function resumeProfile(): HasOne
    {
        return $this->hasOne(ResumeProfile::class);
    }

    public function resumeEntries(): HasMany
    {
        return $this->hasMany(ResumeEntry::class);
    }

    public function scheduleBlocks(): HasMany
    {
        return $this->hasMany(ScheduleBlock::class);
    }

    public function titlePresets(): HasMany
    {
        return $this->hasMany(TitlePreset::class);
    }

    public function comparisons(): HasMany
    {
        return $this->hasMany(Comparison::class);
    }

    public function pushNotifications(): HasMany
    {
        return $this->hasMany(PushNotification::class);
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }
}
