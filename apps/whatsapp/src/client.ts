import type {
  EvolutionInstance,
  EvolutionQRCode,
  EvolutionConnectionState,
  SendTextOptions,
  CreateInstanceOptions,
  InstanceConnectResponse,
} from './types.js';

// ============================================
// Evolution API v2 Client
// ============================================

export class EvolutionClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };

    const res = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Evolution API ${method} ${path} failed (${res.status}): ${errorText}`);
    }

    return res.json() as Promise<T>;
  }

  // ---- Instance Management ----

  async createInstance(options: CreateInstanceOptions): Promise<{ instance: EvolutionInstance; qrcode?: EvolutionQRCode }> {
    return this.request('POST', '/instance/create', {
      instanceName: options.instanceName,
      integration: options.integration || 'WHATSAPP-BAILEYS',
      qrcode: options.qrcode ?? true,
      webhook: options.webhookUrl
        ? {
            url: options.webhookUrl,
            byEvents: options.webhookByEvents ?? false,
            base64: options.webhookBase64 ?? false,
            events: options.webhookEvents || [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
            ],
          }
        : undefined,
    });
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.request('DELETE', `/instance/delete/${instanceName}`);
  }

  async fetchInstances(instanceName?: string): Promise<EvolutionInstance[]> {
    const path = instanceName
      ? `/instance/fetchInstances?instanceName=${instanceName}`
      : '/instance/fetchInstances';
    return this.request('GET', path);
  }

  async getConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
    return this.request('GET', `/instance/connectionState/${instanceName}`);
  }

  async connectInstance(instanceName: string): Promise<InstanceConnectResponse> {
    return this.request('GET', `/instance/connect/${instanceName}`);
  }

  async logoutInstance(instanceName: string): Promise<void> {
    await this.request('DELETE', `/instance/logout/${instanceName}`);
  }

  async restartInstance(instanceName: string): Promise<void> {
    await this.request('PUT', `/instance/restart/${instanceName}`);
  }

  // ---- Messaging ----

  async sendText(instanceName: string, options: SendTextOptions): Promise<unknown> {
    return this.request('POST', `/message/sendText/${instanceName}`, {
      number: options.number,
      text: options.text,
      delay: options.delay || 1000,
    });
  }

  async sendPresence(
    instanceName: string,
    number: string,
    presence: 'composing' | 'recording' | 'paused',
  ): Promise<void> {
    await this.request('POST', `/chat/updatePresence/${instanceName}`, {
      number,
      presence,
    });
  }

  // ---- Webhook Management ----

  async setWebhook(
    instanceName: string,
    url: string,
    events: string[] = ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
  ): Promise<unknown> {
    return this.request('POST', `/webhook/set/${instanceName}`, {
      webhook: {
        enabled: true,
        url,
        byEvents: false,
        base64: false,
        events,
      },
    });
  }

  async getWebhook(instanceName: string): Promise<unknown> {
    return this.request('GET', `/webhook/find/${instanceName}`);
  }

  // ---- Utility ----

  async isOnWhatsApp(instanceName: string, numbers: string[]): Promise<Array<{ exists: boolean; jid: string; number: string }>> {
    return this.request('POST', `/chat/whatsappNumbers/${instanceName}`, {
      numbers,
    });
  }

  async getProfilePicture(instanceName: string, number: string): Promise<{ profilePictureUrl?: string }> {
    return this.request('POST', `/chat/fetchProfilePictureUrl/${instanceName}`, {
      number,
    });
  }

  // ---- Health ----

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('GET', '/instance/fetchInstances');
      return true;
    } catch {
      return false;
    }
  }
}
