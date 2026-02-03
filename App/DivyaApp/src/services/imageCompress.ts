import { NativeModules, Platform } from 'react-native';

type ImageCompressModule = {
  compressBase64: (
    base64: string,
    quality: number,
    maxWidth: number,
    maxHeight: number,
  ) => Promise<string>;
};

const NativeImageCompress: ImageCompressModule | undefined =
  NativeModules.ImageCompress;
const isSupported = Platform.OS === 'android' && !!NativeImageCompress;

export const imageCompress = {
  isSupported,
  async compressBase64(
    base64: string,
    quality: number,
    maxWidth: number,
    maxHeight: number,
  ) {
    if (!isSupported || !base64) return base64;
    return NativeImageCompress!.compressBase64(
      base64,
      quality,
      maxWidth,
      maxHeight,
    );
  },
};
