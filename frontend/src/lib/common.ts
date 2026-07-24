export interface RpcEnvelope<T> {
  success?: boolean
  data: T
  error?: { code: string; message: string } | null
}

export interface RpcResult<T> {
  ok: boolean
  value: T | null
  error: string | null
}

export function unwrapRpcResponse<T>(data: unknown): RpcResult<T> {
  const envelope = data as RpcEnvelope<T> | null
  if (!envelope) {
    return { ok: false, value: null, error: 'No response from server' }
  }
  if (envelope.success === false) {
    return { ok: false, value: null, error: envelope.error?.message ?? 'Unknown error' }
  }
  return { ok: true, value: envelope.data, error: null }
}
