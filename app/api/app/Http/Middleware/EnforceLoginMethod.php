<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Sso\Oidc;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 「SSO だけでログインする」を守らせる (auth:sanctum のあとに置く)。
 * オンの人の、パスワードで発行したトークンは使えない (オンにした時点で、ほかの端末のログインも切れる)。
 * 後続で使えるよう、このリクエストのログイン方法を login_method 属性に入れる。
 */
class EnforceLoginMethod
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();
        $method = ($token->login_method ?? 'pwd') === 'sso' ? 'sso' : 'pwd';
        if ($user && ! self::loginMethodAllowed($user, $method)) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $request->attributes->set('login_method', $method);

        return $next($request);
    }

    /**
     * この方法 (pwd / sso) でのログインを、この利用者に許すか。「SSO だけ」の人には SSO のログインしか許さない。
     * SSO が無効な環境や、非常用の切り替え (OIDC_ALLOW_PASSWORD_FOR_SSO_ONLY=true) のときは守らせない (締め出し防止)
     */
    public static function loginMethodAllowed(User $user, string $method): bool
    {
        $enforced = Oidc::enabled() && ! config('sso.allow_password_for_sso_only');

        return ! ($enforced && $user->sso_only && $method !== 'sso');
    }
}
