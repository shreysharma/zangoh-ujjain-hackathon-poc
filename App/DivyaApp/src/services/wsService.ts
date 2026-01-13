// WebSocket bridge to Gemini Live per-user session.
import { Buffer } from 'buffer';
import { nativeLogger } from './nativeLogger';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { env } from '../config/env';
import { sessionLogger } from './sessionLogger';

type EventHandler = (event: SocketEvent) => void;

type SocketEvent =
  | { type: 'connected'; session_id?: string }
  | { type: 'setup_complete' }
  | { type: 'text_chunk'; text?: string }
  | { type: 'audio_chunk'; audio_data?: string; chunk_number?: number; chunk_size?: number; mime_type?: string }
  | { type: 'input_transcription'; text?: string }
  | { type: 'output_transcription'; text?: string }
  | { type: 'turn_complete' }
  | { type: 'interrupted'; interrupted?: boolean }
  | { type: 'tool_call_start' }
  | { type: 'tool_call_complete' }
  | { type: 'tool_status'; tool?: string; phase?: string; label?: string; duration_ms?: number }
  | { type: 'tool_summary'; tool?: string; summary?: string; duration_ms?: number }
  | { type: 'itinerary'; data?: any }
  | { type: 'error'; error?: string }
  | { type: 'pong' }
  | { type: 'unknown'; raw: any };

type Modality = 'AUDIO' | 'TEXT';

type ConnectOptions = {
  host: string; // e.g. wss://api.example.com:8000
  apiKey?: string;
  authToken?: string;
  modality?: Modality | Modality[];
  headers?: Record<string, string>;
  ticketTitle?: string;
  ticketDescription?: string;
  ticketCategory?: string;
  ticketLat?: number;
  ticketLng?: number;
};

const WS_DEBUG = true;

class WebSocketService {
  private ws: WebSocket | null = null;
  private nativeEmitter: NativeEventEmitter | null = null;
  private nativeSubs: { remove: () => void }[] = [];
  private handlers: Set<EventHandler> = new Set();
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private opts: ConnectOptions | null = null;
  private lastAuthToken: string | undefined;
  private nativeConnected = false;
  private useNative = false;
  private readonly RECONNECT_DELAY_MS = 300;
  private readonly WATCHDOG_MS = 60000;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private ticketInitSent = false;

  connect(opts?: ConnectOptions) {
    this.opts = opts ?? {
      host: env.wsHost,
      apiKey: env.wsApiKey,
      modality: ['AUDIO', 'TEXT'],
    };
    this.lastAuthToken = this.opts?.authToken;
    // Enable auto-reconnect.
    this.shouldReconnect = true;
    this.ticketInitSent = false;
    this.useNative =
      Platform.OS !== 'web' && !!NativeModules.NativeWS;
    this.openSocket();
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopWatchdog();
    this.stopHeartbeat();
    this.teardownNative();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendText(text: string) {
    if (!this.isOpen()) return;
    const payload = JSON.stringify({ type: 'text', text: text ?? '' });
    nativeLogger.log('WS', { sendText: payload });
    if (this.useNative) {
      NativeModules.NativeWS.sendText(payload);
    } else {
      this.ws!.send(payload);
    }
  }

  sendAudioBase64(base64Pcm16k: string) {
    if (!this.isOpen()) return;
    const payload = JSON.stringify({ type: 'audio', audio_data: base64Pcm16k });
    if (this.useNative) {
      NativeModules.NativeWS.sendText(payload);
    } else {
      this.ws!.send(payload);
    }
  }

  sendAudioBinary(pcm: Int16Array) {
    // Disabled: backend expects JSON base64 PCM, not binary frames.
    return;
    if (!this.isOpen()) return;
    const buf = Buffer.from(pcm.buffer);
    // @ts-ignore WebSocket in RN accepts ArrayBuffer/TypedArray
    if (this.useNative) {
      NativeModules.NativeWS.sendBinaryBase64(buf.toString('base64'));
    } else {
      this.ws!.send(buf);
    }
  }

  sendImageBase64(base64Data: string, contentType: string = 'image/jpeg') {
    if (!this.isOpen()) return;
    const payload = JSON.stringify({ type: 'image', image_data: base64Data, content_type: contentType });
    if (this.useNative) {
      NativeModules.NativeWS.sendText(payload);
    } else {
      this.ws!.send(payload);
    }
  }

  sendPing() {
    if (!this.isOpen()) return;
    const payload = JSON.stringify({ type: 'ping' });
    if (this.useNative) {
      NativeModules.NativeWS.sendText(payload);
    } else {
      this.ws!.send(payload);
    }
  }

  sendDisconnect() {
    if (!this.isOpen()) return;
    const payload = JSON.stringify({ type: 'disconnect' });
    if (this.useNative) {
      NativeModules.NativeWS.sendText(payload);
    } else {
      this.ws!.send(payload);
    }
  }

  on(handler: EventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isOpen() {
    if (this.useNative) {
      return this.nativeConnected;
    }
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  private openSocket() {
    if (!this.opts) return;
    if (this.isOpen()) return;
    const { host, apiKey, authToken, modality, headers: extraHeaders } = this.opts;
    const modalityList: Modality[] = Array.isArray(modality)
      ? modality
      : modality
        ? [modality]
        : ['AUDIO'];
    const modalityHeader = modalityList.join(',');
    const isTextOnly = modalityList.length === 1 && modalityList[0] === 'TEXT';
    const effectiveApiKey = apiKey || env.wsApiKey || undefined;
    const url = `${host}/ws`;
    nativeLogger.log('WS', { opening: url, modality: modalityHeader });
    const headers: Record<string, string> = { ...(extraHeaders || {}) };
    if (effectiveApiKey) headers['x-api-key'] = effectiveApiKey;
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (modalityHeader) headers['x-response-modality'] = modalityHeader;
    if (this.useNative) {
      this.setupNative(url, headers);
      return;
    }
    // @ts-ignore react-native WebSocket supports headers in third param
    this.ws = new WebSocket(url, undefined, { headers });
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      nativeLogger.log('WS', 'open');
      this.sendTicketInit();
      this.startHeartbeat();
    };

    this.ws.onmessage = event => {
      if (typeof event.data === 'string') {
        this.handleMessage(event.data);
      } else {
        // binary frame: treat as audio unless modality is TEXT
        const modalityConfig = this.opts?.modality;
        const textOnly =
          modalityConfig === 'TEXT' ||
          (Array.isArray(modalityConfig) &&
            modalityConfig.length === 1 &&
            modalityConfig[0] === 'TEXT');
        if (textOnly) {
          return;
        }
        this.emit({
          type: 'audio_chunk',
          audio_data: Buffer.from(event.data as ArrayBuffer).toString('base64'),
        });
      }
    };

    this.ws.onerror = err => {
      nativeLogger.warn('WS', { error: err?.message || err });
    };

    this.ws.onclose = evt => {
      nativeLogger.log('WS', { close: { code: evt?.code, reason: evt?.reason } });
      // Stop reconnecting if forbidden
      if (evt?.reason?.toString().includes('403')) {
        this.shouldReconnect = false;
      }
      this.stopHeartbeat();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.shouldReconnect) return;
      nativeLogger.log('WS', 'reconnecting');
      this.ticketInitSent = false;
      this.openSocket();
    }, this.RECONNECT_DELAY_MS);
  }

  private setupNative(url: string, headers: Record<string, string>) {
    this.teardownNative();
    this.nativeEmitter = new NativeEventEmitter(NativeModules.NativeWS);
    if (NativeModules.NativeWS?.setNativeAudioPlaybackEnabled) {
      NativeModules.NativeWS.setNativeAudioPlaybackEnabled(true);
    }
    this.nativeSubs.push(
      this.nativeEmitter.addListener('NativeWSOpen', () => {
        this.nativeConnected = true;
        nativeLogger.log('WS', 'open');
        this.sendTicketInit();
        this.startHeartbeat();
      }),
      this.nativeEmitter.addListener('NativeWSMessage', (data: string) => {
        this.handleMessage(data);
      }),
      this.nativeEmitter.addListener('NativeWSBatchParsed', (items: any[]) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => this.handleParsedNative(item));
      }),
      this.nativeEmitter.addListener('NativeWSParsedImmediate', (item: any) => {
        this.handleParsedNative(item);
      }),
      this.nativeEmitter.addListener('NativeWSBinary', (base64: string) => {
        this.emit({ type: 'audio_chunk', audio_data: base64 });
      }),
      this.nativeEmitter.addListener('NativeWSClose', (evt: any) => {
        nativeLogger.log('WS', { close: { code: evt?.code, reason: evt?.reason } });
        this.nativeConnected = false;
        if (evt?.reason?.toString().includes('403')) {
          this.shouldReconnect = false;
        }
        this.stopHeartbeat();
        this.scheduleReconnect();
      }),
      this.nativeEmitter.addListener('NativeWSError', (err: any) => {
        nativeLogger.warn('WS', {
          error: err?.message || err,
          cause: err?.cause || '',
        });
      }),
    );
    NativeModules.NativeWS.connect(url, headers);
  }

  private teardownNative() {
    if (!this.useNative) return;
    if (this.nativeSubs.length) {
      this.nativeSubs.forEach(sub => sub.remove());
      this.nativeSubs = [];
    }
    if (this.nativeEmitter) {
      this.nativeEmitter = null;
    }
    if (NativeModules.NativeWS?.disconnect) {
      NativeModules.NativeWS.disconnect();
    }
    this.nativeConnected = false;
  }

  private handleMessage(data: string) {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      nativeLogger.warn('WS', {
        parseError: data?.slice?.(0, 200) || data,
      });
      this.emit({ type: 'unknown', raw: data });
      return;
    }
    const type = msg?.type;
    switch (type) {
      case 'connected':
      case 'setup_complete':
      case 'text_chunk':
      case 'audio_chunk':
      case 'input_transcription':
      case 'output_transcription':
      case 'turn_complete':
      case 'tool_call_start':
      case 'tool_call_complete':
      case 'tool_status':
      case 'tool_summary':
      case 'itinerary':
      case 'interrupted':
      case 'error':
      case 'pong':
        this.emit(msg as SocketEvent);
        break;
      default:
        nativeLogger.warn('WS', { unknownEvent: msg });
        this.emit({ type: 'unknown', raw: msg });
    }
  }

  private handleParsedNative(item: any) {
    const type = item?.type;
    if (!type) {
      nativeLogger.warn('WS', { nativeParsedMissingType: item });
      this.emit({ type: 'unknown', raw: item });
      return;
    }
    if (type === 'itinerary' && typeof item.data === 'string') {
      try {
        item.data = JSON.parse(item.data);
      } catch {}
    }
    if (
      type === 'connected' ||
      type === 'setup_complete' ||
      type === 'text_chunk' ||
      type === 'audio_chunk' ||
      type === 'input_transcription' ||
      type === 'output_transcription' ||
      type === 'turn_complete' ||
      type === 'tool_call_start' ||
      type === 'tool_call_complete' ||
      type === 'tool_status' ||
      type === 'tool_summary' ||
      type === 'itinerary' ||
      type === 'interrupted' ||
      type === 'error' ||
      type === 'pong'
    ) {
      this.emit(item as SocketEvent);
      return;
    }
    nativeLogger.warn('WS', { nativeParsedUnknownType: item });
    this.emit({ type: 'unknown', raw: item });
  }

  private sendTicketInit() {
    if (this.ticketInitSent || !this.isOpen()) return;
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const title = this.opts?.ticketTitle || `Ticket #${randomId}`;
    const description = this.opts?.ticketDescription;
    const categories = ['Enquiry', 'Grievance', 'Support'];
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const category = this.opts?.ticketCategory || randomCategory;
    const payload = {
      type: 'ticket_init',
      title,
      ...(description ? { description } : {}),
      ...(category ? { category } : {}),
      ...(typeof this.opts?.ticketLat === 'number'
        ? { location_lat: this.opts?.ticketLat }
        : {}),
      ...(typeof this.opts?.ticketLng === 'number'
        ? { location_lng: this.opts?.ticketLng }
        : {}),
    };
    const message = JSON.stringify(payload);
    if (this.useNative) {
      NativeModules.NativeWS.sendText(message);
    } else {
      this.ws!.send(message);
    }
    this.ticketInitSent = true;
  }

  private emit(event: SocketEvent) {
    if (
      event.type === 'audio_chunk' ||
      event.type === 'output_transcription' ||
      event.type === 'turn_complete'
    ) {
      this.resetWatchdog();
    }
    const logEvent: Record<string, unknown> =
      event && typeof event === 'object' ? { ...event } : { event };
    if (logEvent.audio_data && typeof logEvent.audio_data === 'string') {
      logEvent.audio_data = `[base64:${logEvent.audio_data.length}]`;
    }
    if (logEvent.image_data && typeof logEvent.image_data === 'string') {
      logEvent.image_data = `[base64:${logEvent.image_data.length}]`;
    }
    nativeLogger.log('WS', { type: event.type, event: logEvent });
    this.handlers.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        // swallow
      }
    });
  }

  private resetWatchdog() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(() => {
      nativeLogger.warn('WS', 'watchdog timeout; reconnecting');
      this.ticketInitSent = false;
      this.teardownNative();
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.openSocket();
    }, this.WATCHDOG_MS);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      this.sendPing();
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }
}

export const wsService = new WebSocketService();
export type { SocketEvent, ConnectOptions };
