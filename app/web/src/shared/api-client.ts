/**
 * API クライアント本体。トークンの保存先（Web は localStorage、モバイルは SecureStore）と
 * ベース URL の注入元だけが端末ごとに違うので、それらは configureApiClient で差し込む。
 */

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export interface ApiClientConfig {
  baseUrl: string
  getToken: () => string | null
  /** 401 を受けたとき。保存済みのトークンを捨ててログイン画面へ戻す。 */
  onUnauthorized: () => void | Promise<void>
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | string[] | undefined>
}

let config: ApiClientConfig | null = null

export function configureApiClient(next: ApiClientConfig): void {
  config = next
}

export function apiBaseUrl(): string {
  if (!config) {
    throw new Error('configureApiClient() を先に呼んでください')
  }

  return config.baseUrl
}

function buildQueryString(params?: RequestOptions['params']): string {
  if (!params) return ''

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) search.append(`${key}[]`, item)
    } else {
      search.append(key, String(value))
    }
  }

  const qs = search.toString()

  return qs ? `?${qs}` : ''
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options
  const token = config?.getToken() ?? null

  const response = await fetch(`${apiBaseUrl()}${path}${buildQueryString(params)}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      await config?.onUnauthorized()
    }
    throw new ApiError(response.status, data?.message ?? 'リクエストに失敗しました', data?.errors)
  }

  return data as T
}

/** `{ data: T }` で包まれたレスポンスの中身だけを返す。 */
export async function apiData<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await apiRequest<{ data: T }>(path, options)

  return res.data
}

/**
 * 画面に出すエラー文言。バリデーションエラーなら最初の項目の文言、それ以外は API のメッセージ、
 * 通信自体の失敗など API から文言が得られないときは fallback を使う。
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined

    return first ?? err.message
  }

  return fallback
}
