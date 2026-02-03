import React from "react";
import { View, TouchableOpacity, Image, StyleSheet, Animated } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";

type Props = {
  isListening: boolean;
  onVideoClick: () => void;
  onCameraSwitch: () => void;
  onMicToggle: () => void;
  currentTurnActive?: boolean;
};

const ComprehensiveControls = ({
  isListening,
  onVideoClick,
  onCameraSwitch,
  onMicToggle,
  currentTurnActive
}: Props) => {
  return (
    <View style={styles.container}>
      {/* LEFT GROUP */}
      <View style={styles.leftGroup}>
        {/* Close Button */}
        <TouchableOpacity onPress={onVideoClick}>
          <Svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <Rect x="0.5" y="0.5" width="40.27" height="40.27" rx="20.13" fill="white" />
            <Rect x="0.5" y="0.5" width="40.27" height="40.27" rx="20.13" stroke="#E9E8E8" />
            <Path d="M25.6 16L15.6 26M15.6 16L25.6 26" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>

        {/* Switch Camera Button */}
        <TouchableOpacity onPress={onCameraSwitch}>
          <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <Rect x="1" y="1" width="41.67" height="41.67" rx="21" fill="white" />
            <Rect x="1" y="1" width="41.67" height="41.67" rx="21" stroke="#E9E8E8" />
              <Path d="M11.6519 18.3772C11.6519 18.0269 11.6519 17.8517 11.6665 17.7042C11.8075 16.2813 12.9331 15.1556 14.3561 15.0146C14.5036 15 14.6882 15 15.0574 15C15.1997 15 15.2708 15 15.3312 14.9963C16.1025 14.9496 16.7778 14.4629 17.066 13.746C17.0886 13.6899 17.1097 13.6266 17.1519 13.5C17.194 13.3734 17.2151 13.3101 17.2377 13.254C17.5259 12.5371 18.2012 12.0504 18.9725 12.0037C19.0329 12 19.0996 12 19.233 12H24.0707C24.2041 12 24.2708 12 24.3312 12.0037C25.1025 12.0504 25.7778 12.5371 26.066 13.254C26.0886 13.3101 26.1097 13.3734 26.1519 13.5C26.194 13.6266 26.2151 13.6899 26.2377 13.746C26.5259 14.4629 27.2012 14.9496 27.9725 14.9963C28.0329 15 28.104 15 28.2463 15C28.6155 15 28.8001 15 28.9476 15.0146C30.3706 15.1556 31.4963 16.2813 31.6372 17.7042C31.6519 17.8517 31.6519 18.0269 31.6519 18.3772V26.2C31.6519 27.8802 31.6519 28.7202 31.3249 29.362C31.0373 29.9265 30.5783 30.3854 30.0138 30.673C29.3721 31 28.532 31 26.8519 31H16.4519C14.7717 31 13.9316 31 13.2899 30.673C12.7254 30.3854 12.2665 29.9265 11.9788 29.362C11.6519 28.7202 11.6519 27.8802 11.6519 26.2V18.3772Z" stroke="#757575" strokeWidth="1.73" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M26.1235 22.4717C25.9766 23.8523 25.1943 25.1461 23.8999 25.8934C21.7492 27.1351 18.9992 26.3983 17.7576 24.2476L17.6253 24.0186M17.1799 21.5269C17.3268 20.1462 18.1091 18.8525 19.4036 18.1051C21.5542 16.8635 24.3042 17.6003 25.5459 19.7509L25.6781 19.98M17.1519 25.2082L17.5391 23.7629L18.9844 24.1502M24.3194 19.8484L25.7646 20.2356L26.1519 18.7904" stroke="#757575" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            
          </Svg>
        </TouchableOpacity>
      </View>

      {/* CENTER Circular Agent */}
      <View style={styles.center}>
        {/* Pulse Glow */}
        {currentTurnActive && <Animated.View style={styles.glow} />}

        {/* Main Circle */}
        <View style={[styles.mainCircle, currentTurnActive && styles.speakingGlow]}>
          <Image
            source={require("../../../assets/web-public/cameraimage.png")}
            style={styles.circleImg}
          />
        </View>
      </View>

      {/* RIGHT Group */}
      <View style={styles.rightGroup}>
        {/* Mic Button */}
        <TouchableOpacity onPress={onMicToggle} style={isListening ? styles.pulse : undefined}>
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
        <TouchableOpacity onPress={onVideoClick}>
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

export default ComprehensiveControls;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: "center",
    paddingHorizontal: 20
  },
  leftGroup: { flexDirection: "row", gap: 10 },
  rightGroup: { flexDirection: "row", gap: 10 },
  center: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10
  },
  glow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: "rgba(255,165,82,0.3)"
  },
  mainCircle: {
    width: 80,
    height: 80,
    borderRadius: 80,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  speakingGlow: {
    shadowColor: "#FFB366",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12
  },
  circleImg: { width: "100%", height: "100%" },
  pulse: {
    transform: [{ scale: 1.1 }]
  }
});
