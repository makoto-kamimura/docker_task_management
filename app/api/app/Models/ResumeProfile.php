<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 履歴書の個人情報と自由記述（JIS 様式の上半分と志望動機など）。どの項目も任意。
 */
class ResumeProfile extends Model
{
    /** @use HasFactory<\Database\Factories\ResumeProfileFactory> */
    use HasFactory;

    /**
     * 暗号化して保存する文字列項目。住所・連絡先など個人を特定できる情報を含むため、
     * DB のダンプやバックアップだけでは読めないようにする（鍵は APP_KEY。変えると読めなくなる）。
     */
    public const ENCRYPTED_FIELDS = [
        'name',
        'name_kana',
        'birth_date',
        'gender',
        'postal_code',
        'address',
        'address_kana',
        'phone',
        'email',
        'contact_postal_code',
        'contact_address',
        'contact_phone',
        'motivation',
        'self_pr',
        'requests',
    ];

    public const NUMERIC_FIELDS = ['commute_minutes', 'dependents_count'];

    public const BOOLEAN_FIELDS = ['has_spouse', 'spouse_dependent'];

    protected $fillable = [
        ...self::ENCRYPTED_FIELDS,
        ...self::NUMERIC_FIELDS,
        ...self::BOOLEAN_FIELDS,
    ];

    protected function casts(): array
    {
        return [
            ...array_fill_keys(self::ENCRYPTED_FIELDS, 'encrypted'),
            'commute_minutes' => 'integer',
            'dependents_count' => 'integer',
            'has_spouse' => 'boolean',
            'spouse_dependent' => 'boolean',
        ];
    }

    /** API で返す項目の一覧（未登録のユーザーには全項目 null を返すために使う）。 */
    public static function fields(): array
    {
        return [...self::ENCRYPTED_FIELDS, ...self::NUMERIC_FIELDS, ...self::BOOLEAN_FIELDS];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
