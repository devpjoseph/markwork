const API_BASE = import.meta.env.VITE_API_BASE_URL + '/api/v1'

export type SSEEventType =
  | 'assignment.submitted'
  | 'assignment.status_changed'
  | 'comment.added'
  | 'comment.status_changed'

export interface SSEPayload {
  type: SSEEventType
  data: Record<string, string>
}

type SSEHandler = (payload: SSEPayload) => void

export class SSEClient {
  private eventSource: EventSource | null = null
  private handlers: Set<SSEHandler> = new Set()

  connect(token: string): void {
    if (this.eventSource) return

    // EventSource doesn't support custom headers, so we pass token as query param
    const url = `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`
    this.eventSource = new EventSource(url)

    this.eventSource.onmessage = (event) => {
      try {
        const payload: SSEPayload = JSON.parse(event.data)
        this.handlers.forEach((handler) => handler(payload))
      } catch {
        // ignore malformed events / keep-alive pings
      }
    }

    this.eventSource.onerror = () => {
      this.disconnect()
    }
  }

  disconnect(): void {
    this.eventSource?.close()
    this.eventSource = null
  }

  on(handler: SSEHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }
}

export const sseClient = new SSEClient()
