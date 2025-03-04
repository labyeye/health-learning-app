import LottieView from "lottie-react-native";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  useAnimatedGestureHandler,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
  runOnJS
} from "react-native-reanimated";
import Animated from "react-native-reanimated";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const navigation = useNavigation();
  const slideX = useSharedValue(0); 

  const navigateToHome3 = () => {
    navigation.navigate("Login");
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (e) => {
      'worklet'; // Mark as worklet
      if (e.translationX < 0) {
        slideX.value = -e.translationX; // Fixed typo here: 'translationslideX' to 'translationX'
      } else {
        slideX.value = e.translationX;
      }
    },
    onEnd: () => {
      'worklet'; // Mark as worklet
      if (slideX.value < 150) {
        slideX.value = withSpring(10);
      } else {
        slideX.value = withSpring(240);
        runOnJS(navigateToHome3)(); // Use runOnJS to call navigation function
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideX.value }],
    };
  });

  const { width, height } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: "center", width: "90%" ,marginTop:30}}>
        <Text style={styles.name}>Welcome to</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>Learni</Text>
          <Text style={styles.nameShaala}>fy</Text>
        </View>
        <Text style={styles.tagline}>Like a cooking school with tips and strategies.</Text>
      </View>
      <LottieView
        style={styles.lottie}
        source={require("../../../src/assets/lottie/health.json")}
        autoPlay
        loop
      />
      <View style={styles.sliderContainer}>
        <GestureHandlerRootView>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
              <Text style={styles.iconText}>{">"}</Text>
            </Animated.View>
          </PanGestureHandler>
        </GestureHandlerRootView>
        <Text style={styles.buttonText}>Get Started</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1c1c1c",
  },
  lottie: {
    width: 300,
    height: 300,
    marginTop:60
  },
  titleContainer: {
    flexDirection: "row",

  },
  name: {
    color: "white",
    fontFamily: "Poppins-Regular",
    fontSize: 39,
  },
  tagline: {
    color: "white",
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  nameShaala: {
    color: "#FF6347", // Customize color for "Shaala"
    fontFamily: "Poppins-Regular",
    fontSize: 39,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: "absolute",
    bottom: 50,
    width: 250, 
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f28c34",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Home;
