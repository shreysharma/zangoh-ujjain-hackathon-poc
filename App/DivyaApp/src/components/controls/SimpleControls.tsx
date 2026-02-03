import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { launchImageLibrary } from 'react-native-image-picker';
import { sessionLogger } from '../../services/sessionLogger';
import { wsService } from '../../services/wsService';
import { imageCompress } from '../../services/imageCompress';

type Props = {
  isVideoOpen: boolean;
  isListening: boolean;
  onVideoClick: () => void;
  onMicToggle: () => void;
  onImagePicked?: (uri: string, name: string) => void;
};

const SimpleControls = ({
  isVideoOpen,
  isListening,
  onVideoClick,
  onMicToggle,
  onImagePicked,
}: Props) => {
  const handlePick = async () => {
    const result: any = await launchImageLibrary({ mediaType: 'photo', includeBase64: true });
    if (!result?.didCancel && result?.assets?.length > 0) {
      const img = result.assets[0];
      if (!img?.base64 || !img?.type) return;
      const compressed = await imageCompress.compressBase64(
        img.base64,
        70,
        1280,
        1280,
      );
      // Always send as JPEG over WS to match backend expectation
      const mime = 'image/jpeg';
      const fileName = img.fileName ?? 'image.jpg';
      const dataUrl = `data:${mime};base64,${compressed}`;
      sessionLogger.appendImageFrame(dataUrl);
      sessionLogger.appendFile(dataUrl, fileName);
      const preview = `${compressed.slice(0, 32)}...${compressed.slice(-32)}`;
      console.log('[audio] sending picked image via WS', { length: compressed.length, fileName, preview });
      wsService.sendImageBase64(compressed, mime);
      // Send a text hint so backend knows to respond to the image
      wsService.sendText(`[image_upload:${fileName}] Please analyze/describe this image.`);
      onImagePicked?.(dataUrl, img.fileName ?? 'image.png');
    }
  };

  return (
    <View style={styles?.container}>
      <View style={styles.innerContainer}>
        
        {/* Left Button */}
        <TouchableOpacity style={styles.iconButton} onPress={handlePick}>
          {/* Image Upload Icon */}
          <Svg width="39" height="39" viewBox="0 0 39 39" fill="none">
            <Rect x="0.7" y="0.89" width="37.5" height="37.5" rx="18.7" fill="white"/>
            <Rect x="0.7" y="0.89" width="37.5" height="37.5" rx="18.7" stroke="#E9E8E8" strokeWidth="0.92"/>
            <Path
              d="M28.0639 18.6029L19.608 27.0588C17.6851 28.9818 14.5673 28.9818 12.6444 27.0588C10.7214 25.1358 10.7214 22.0181 12.6444 20.0951L21.1003 11.6392C22.3822 10.3572 24.4607 10.3572 25.7427 11.6392C27.0247 12.9212 27.0247 14.9997 25.7427 16.2817L17.6184 24.406C16.9774 25.0469 15.9382 25.0469 15.2972 24.406C14.6562 23.765 14.6562 22.7257 15.2972 22.0847L22.4267 14.9553"
              stroke="#757575"
              strokeWidth="1.87"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Mic Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onMicToggle}>
          {!isListening ? (
            // Mic Off Icon
            <Svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <Rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" fillOpacity="0.8" />
              <Rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#E9E8E8" />
              <Path
                d="M21.5896 16.7531V12.9526C21.5896 11.5215 20.4294 10.3613 18.9983 10.3613C17.9812 10.3613 17.1009 10.9474 16.6768 11.8003M18.9983 25.0451V27.6363M18.9983 25.0451C15.6591 25.0451 12.9521 22.3381 12.9521 18.9988V17.2713M18.9983 25.0451C22.3376 25.0451 25.0446 22.3381 25.0446 18.9988V17.2713M15.5433 27.6363H22.4533M10.3608 10.3613L27.6358 27.6363M18.9983 21.5901C17.5672 21.5901 16.4071 20.4299 16.4071 18.9988V16.4076L20.8317 20.83C20.3627 21.2996 19.7145 21.5901 18.9983 21.5901Z"
                stroke="#757575"
                strokeWidth="1.73"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            // Mic On Icon
            <Svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <Rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill="white" />
              <Rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#E9E8E8" />
              <Path
                d="M25.0446 17.2713V18.9988C25.0446 22.3381 22.3377 25.0451 18.9984 25.0451M12.9521 17.2713V18.9988C12.9521 22.3381 15.6591 25.0451 18.9984 25.0451M18.9984 25.0451V27.6363M15.5434 27.6363H22.4534M18.9984 21.5901C17.5673 21.5901 16.4071 20.4299 16.4071 18.9988V12.9526C16.4071 11.5215 17.5673 10.3613 18.9984 10.3613C20.4295 10.3613 21.5896 11.5215 21.5896 12.9526V18.9988C21.5896 20.4299 20.4295 21.5901 18.9984 21.5901Z"
                stroke="#757575"
                strokeWidth="1.73"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </TouchableOpacity>

        {/* Video Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onVideoClick}>
          <Svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            {/* Same icon you provided */}
            <Rect x="0.46" y="0.46" width="37.08" height="37.08" rx="18.54" fill="white" />
            <Rect x="0.46" y="0.46" width="37.08" height="37.08" rx="18.54" stroke="#E9E8E8" strokeWidth="0.92" />
            <Path
              d="M28.2071 16.1743V21.8249C28.2071 22.3827 28.2071 22.6616 28.0968 22.7907C28.0011 22.9028 27.8575 22.9623 27.7106 22.9507C27.5413 22.9374 27.3441 22.7402 26.9497 22.3458L23.6035 18.9996L26.9497 15.6535C27.3441 15.2591 27.5413 15.0619 27.7106 15.0486C27.8575 15.037 28.0011 15.0965 28.0968 15.2085C28.2071 15.3377 28.2071 15.6165 28.2071 16.1743Z"
              stroke="#757575"
              strokeWidth="1.84"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M9.793 16.9741V21.0252C9.793 22.5721 9.793 23.3456 10.094 23.9364C10.3588 24.4561 10.7814 24.8787 11.3011 25.1435C11.892 25.4446 12.6654 25.4446 14.2124 25.4446H19.1842C20.7311 25.4446 21.5046 25.4446 22.0954 25.1435C22.6151 24.8787 23.0377 24.4561 23.3025 23.9364C23.6035 23.3456 23.6035 22.5721 23.6035 21.0252V16.9741C23.6035 15.4271 23.6035 14.6537 23.3025 14.0628C23.0377 13.5431 22.6151 13.1206 22.0954 12.8557C21.5046 12.5547 20.7311 12.5547 19.1842 12.5547H14.2124C12.6654 12.5547 11.892 12.5547 11.3011 12.8557C10.7814 13.1206 10.3588 13.5431 10.094 14.0628C9.793 14.6537 9.793 15.4271 9.793 16.9741Z"
              stroke="#757575"
              strokeWidth="1.84"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 35,
  },
  iconButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
});

export default SimpleControls;
