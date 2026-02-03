import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';

type LogEntry = {
  id: string;
  timestamp: number;
  type: 'user_text' | 'bot_text' | 'bot_audio' | 'user_audio' | 'image_frame' | 'file' | 'itinerary';
  text?: string;
  data?: string;
  filename?: string;
};

const STORAGE_KEY = 'conversation-log';
const BOT_SEEN_KEY = 'conversation-bot-text-seen';
let pendingBotAudioChunks: string[] = [];
let pendingUserAudioChunks: string[] = [];
const clearedListeners = new Set<() => void>();

async function loadEntries(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

async function saveEntries(entries: LogEntry[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

async function markBotSeen() {
  try {
    await AsyncStorage.setItem(BOT_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

async function append(role: 'user' | 'bot', text?: string) {
  if (!text || !text.trim()) return;
  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: role === 'user' ? 'user_text' : 'bot_text',
    text: text.trim(),
    timestamp: Date.now(),
  };
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
  if (role === 'bot') {
    void markBotSeen();
  }
}

async function appendBotAudioChunk(base64?: string) {
  if (!base64) return;
  pendingBotAudioChunks.push(base64);
}

async function flushBotAudioTurn() {
  if (!pendingBotAudioChunks.length) return;
  const combined = pendingBotAudioChunks.join('');
  const entry: LogEntry = {
    id: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'bot_audio',
    data: combined,
    timestamp: Date.now(),
  };
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
  pendingBotAudioChunks = [];
}

async function appendUserAudioChunk(base64?: string) {
  if (!base64) return;
  pendingUserAudioChunks.push(base64);
}

async function flushUserAudioTurn() {
  if (!pendingUserAudioChunks.length) return;
  const combined = pendingUserAudioChunks.join('');
  const entry: LogEntry = {
    id: `uaudio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'user_audio',
    data: combined,
    timestamp: Date.now(),
  };
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
  pendingUserAudioChunks = [];
}

async function appendImageFrame(base64?: string) {
  if (!base64) return;
  const entry: LogEntry = {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'image_frame',
    data: base64,
    timestamp: Date.now(),
  };
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
}

async function appendFile(base64?: string, filename?: string) {
  if (!base64) return;
  const entry: LogEntry = {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'file',
    data: base64,
    filename,
    timestamp: Date.now(),
  };
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
}

async function appendItinerary(json?: any) {
  if (!json) return;
  const entry: LogEntry = {
    id: `itin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'itinerary',
    data: typeof json === 'string' ? json : JSON.stringify(json),
    timestamp: Date.now(),
  };
  const entries = await loadEntries();
  entries.push(entry);
  await saveEntries(entries);
}

async function clear() {
  await AsyncStorage.multiRemove([STORAGE_KEY, BOT_SEEN_KEY]);
  clearedListeners.forEach(cb => {
    try {
      cb();
    } catch {}
  });
}

async function upload(token?: string) {
  const entries = await loadEntries();
  if (!entries.length || !env.apiBase) {
    console.log('[sessionLogger] skip upload; entries', entries.length, 'apiBase', env.apiBase);
    return;
  }
  const filename = `conversation_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const payload = {
    filename,
    payload: {
      conversationData: entries,
    },
  };
  console.log('[sessionLogger] uploading', filename, 'entries', entries.length);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (env.wsApiKey) headers['x-api-key'] = env.wsApiKey;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${env.apiBase}/upload-json`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.log('[sessionLogger] upload failed status', res.status);
      // Clear locally so UX resets even if backend fails; logs are already serialized in memory.
      await clear();
      return;
    }
    console.log('[sessionLogger] upload success, clearing log');
    await clear();
    clearedListeners.forEach(cb => {
      try {
        cb();
      } catch {}
    });
  } catch (e) {
    console.log('[sessionLogger] upload error', e);
    // keep entries on error
  }
}

async function hasBotMessages() {
  try {
    const flag = await AsyncStorage.getItem(BOT_SEEN_KEY);
    if (flag === '1') return true;
  } catch {
    // ignore and continue checking entries
  }
  const entries = await loadEntries();
  const hasBot = entries.some(entry => entry.type === 'bot_text' && !!entry.text);
  if (hasBot) {
    void markBotSeen();
  }
  return hasBot;
}

export const sessionLogger = {
  appendUser: (text?: string) => append('user', text),
  appendBot: (text?: string) => append('bot', text),
  appendBotAudioChunk,
  flushBotAudioTurn,
  appendUserAudioChunk,
  flushUserAudioTurn,
  appendImageFrame,
  appendFile,
  appendItinerary,
  upload,
  clear,
  hasBotMessages,
  onCleared: (cb: () => void) => {
    clearedListeners.add(cb);
    return () => clearedListeners.delete(cb);
  },
};
