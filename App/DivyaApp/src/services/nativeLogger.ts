import { NativeModules } from 'react-native';

type LoggerNative = {
  log: (tag: string, message: string) => void;
  warn: (tag: string, message: string) => void;
  error: (tag: string, message: string) => void;
};

const NativeLogger: LoggerNative | undefined = (NativeModules as any).Logger;

const safeString = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value);

export const nativeLogger = {
  log(tag: string, message: unknown) {
    if (NativeLogger?.log) {
      NativeLogger.log(tag, safeString(message));
    }
  },
  warn(tag: string, message: unknown) {
    if (NativeLogger?.warn) {
      NativeLogger.warn(tag, safeString(message));
    }
  },
  error(tag: string, message: unknown) {
    if (NativeLogger?.error) {
      NativeLogger.error(tag, safeString(message));
    }
  },
};
