// ============================================
// Evolution API v2 Types
// ============================================

export interface EvolutionInstance {
  instanceName: string;
  instanceId?: string;
  status: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
}

export interface EvolutionQRCode {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

export interface EvolutionConnectionState {
  instance: string;
  state: 'open' | 'close' | 'connecting';
}

export interface EvolutionMessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

export interface EvolutionMessage {
  key: EvolutionMessageKey;
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text?: string;
    };
  };
  messageType?: string;
  messageTimestamp?: number;
}

// Webhook payload sent by Evolution API to our endpoint
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  apikey?: string;
  data: {
    // messages.upsert
    key?: EvolutionMessageKey;
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
    // connection.update
    state?: string;
    statusReason?: number;
    // qrcode.updated
    qrcode?: EvolutionQRCode;
  };
}

export interface SendTextOptions {
  number: string;
  text: string;
  delay?: number;
}

export interface CreateInstanceOptions {
  instanceName: string;
  integration?: string;
  qrcode?: boolean;
  webhookUrl?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  webhookEvents?: string[];
}

export interface InstanceConnectResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}
