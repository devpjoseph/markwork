// Google Identity Services (GSI) integration
// Load the GSI script dynamically and prompt for token

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void
          prompt: () => void
          renderButton: (element: HTMLElement, options: object) => void
          revoke: (email: string, done: () => void) => void
        }
      }
    }
  }
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: { credential: string }) => void
  auto_select?: boolean
}

export function waitForGoogleScript(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve()
      return
    }
    const interval = 100
    let elapsed = 0
    const timer = setInterval(() => {
      if (window.google) {
        clearInterval(timer)
        resolve()
      } else if ((elapsed += interval) >= timeoutMs) {
        clearInterval(timer)
        reject(new Error('Google Identity Services script failed to load.'))
      }
    }, interval)
  })
}

export function initGoogleAuth(
  clientId: string,
  onCredential: (idToken: string) => void,
): void {
  if (!window.google) {
    console.error('Google Identity Services script not loaded.')
    return
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: ({ credential }) => onCredential(credential),
    auto_select: false,
  })
}

export function renderGoogleButton(element: HTMLElement, width?: number): void {
  window.google?.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    width: width ?? 300,
  })
}

export function triggerGooglePrompt(): void {
  window.google?.accounts.id.prompt()
}

export function revokeGoogleSession(email: string): void {
  window.google?.accounts.id.revoke(email, () => {})
}
