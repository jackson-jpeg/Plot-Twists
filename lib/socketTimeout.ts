/**
 * Wraps a socket emit callback in a timeout.
 * If the server never responds, the promise rejects with a timeout error.
 */
export function withTimeout<T>(
  emitFn: (cb: (response: T) => void) => void,
  timeoutMs = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    emitFn((response) => {
      clearTimeout(timer)
      resolve(response)
    })
  })
}
