// src/lib/auth/tab-sync.ts
/**
 * Utilitário para sincronização entre abas no fluxo de autenticação
 * Usado para comunicar conclusão do reset de senha entre abas
 */

type TabMessage = {
  type: 'password-reset-completed' | 'password-reset-started'
  timestamp: number
}

class TabCommunicator {
  private channel: BroadcastChannel | null = null
  private listeners: Map<string, Set<(data: TabMessage) => void>> = new Map()
  
  constructor() {
    // Tenta usar BroadcastChannel se disponível
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('lp-factory-auth')
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data)
        }
      } catch (e) {
        // Fallback para localStorage se BroadcastChannel falhar
        this.setupLocalStorageFallback()
      }
    } else {
      this.setupLocalStorageFallback()
    }
  }
  
  private setupLocalStorageFallback() {
    if (typeof window === 'undefined') return
    
    // Escuta mudanças no localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'lp-factory-auth-message' && e.newValue) {
        try {
          const message = JSON.parse(e.newValue)
          this.handleMessage(message)
          // Limpa mensagem após processar
          setTimeout(() => {
            localStorage.removeItem('lp-factory-auth-message')
          }, 100)
        } catch (err) {
          console.error('Failed to parse tab message:', err)
        }
      }
    })
  }
  
  private handleMessage(data: TabMessage) {
    const listeners = this.listeners.get(data.type)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
  
  emit(type: TabMessage['type']) {
    const message: TabMessage = {
      type,
      timestamp: Date.now()
    }
    
    if (this.channel) {
      // Usa BroadcastChannel
      this.channel.postMessage(message)
    } else if (typeof window !== 'undefined') {
      // Fallback para localStorage
      try {
        localStorage.setItem('lp-factory-auth-message', JSON.stringify(message))
        // Auto-limpa após 1 segundo
        setTimeout(() => {
          localStorage.removeItem('lp-factory-auth-message')
        }, 1000)
      } catch (err) {
        console.error('Failed to emit tab message:', err)
      }
    }
  }
  
  on(type: TabMessage['type'], callback: (data: TabMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
    
    // Retorna função para remover listener
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        listeners.delete(callback)
      }
    }
  }
  
  destroy() {
    if (this.channel) {
      this.channel.close()
    }
    this.listeners.clear()
  }
}

// Singleton para uso global
let instance: TabCommunicator | null = null

export function getTabCommunicator(): TabCommunicator {
  if (!instance && typeof window !== 'undefined') {
    instance = new TabCommunicator()
  }
  return instance!
}

export function emitPasswordResetCompleted() {
  const communicator = getTabCommunicator()
  if (communicator) {
    communicator.emit('password-reset-completed')
  }
}

export function onPasswordResetCompleted(callback: () => void) {
  const communicator = getTabCommunicator()
  if (communicator) {
    return communicator.on('password-reset-completed', callback)
  }
  return () => {} // noop cleanup
}
