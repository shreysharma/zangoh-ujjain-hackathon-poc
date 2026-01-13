import React from "react";
import {
  Image,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  onStartAudio: () => void;
  onLogin: () => void;
};

const WelcomeScreen = ({ onStartAudio }: Props) => {
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Background Layer */}
        <View style={styles.bgLayer} />

        {/* Title */}
        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>Divya Darshak</Text>
        </View>

        {/* Central Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("../../assets/web-public/sphere.gif")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleWrapper}>
          <Text style={styles.subtitleText}>
            Mahakumbh mein apka margdarshak!
          </Text>
        </View>

        {/* Button */}
        <View style={styles.btnContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={onStartAudio}>
            <Text style={styles.startBtnText}>Yatra Shuru Karein</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFAF4",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    width: "100%",
    height: "100%",
    maxWidth: 520,
    alignItems: "center",
    backgroundColor: "#FFFAF4",
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFAF8",
  },

  // Title
  titleWrapper: {
    position: "absolute",
    top: "10%",
    width: "80%",
    alignItems: "center",
  },
  titleText: {
    fontSize: 34,
    color: "#F46200",
    fontWeight: "bold",
    textAlign: "center",
  },

  // Image
  imageWrapper: {
    position: "absolute",
    top: "22%",
    width: 150,
    height: 150,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
  },

  // Subtitle
  subtitleWrapper: {
    position: "absolute",
    top: "45%",
    width: "85%",
    alignItems: "center",
  },
  subtitleText: {
    fontSize: 22,
    color: "#393939",
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Button
  btnContainer: {
    position: "absolute",
    top: "80%",
    alignItems: "center",
  },
  startBtn: {
    width: 300,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F46200",
    borderRadius: 12,
  },
  startBtnText: {
    fontSize: 16,
    color: "#FFFAF4",
    fontWeight: "600",
  },
});
