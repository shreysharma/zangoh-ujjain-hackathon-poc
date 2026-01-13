// React Native-safe video service stub. Implement with react-native-camera or vision modules as needed.

import { wsService } from "./wsService";

class VideoService {
  async startCamera(): Promise<null> {
    return null;
  }
  async startScreenShare(): Promise<null> {
    return null;
  }
  stopVideoStream(): void {}
  setVideoElement(): void {}
  startFrameCapture(): void {}
  stopFrameCapture(): void {}
  async captureFrameAsBlob(): Promise<string | null> {
    return null;
  }
  async captureFrameAsBase64(): Promise<string | null> {
    return null;
  }
  async sendImageBase64(base64: string, contentType = 'image/jpeg'): Promise<void> {
    wsService.sendImageBase64(base64, contentType);
  }
}

export const videoService = new VideoService();
