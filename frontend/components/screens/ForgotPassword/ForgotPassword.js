import LottieView from "lottie-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Alert,
} from "react-native";

const Forgot = ({ navigation }) => {
  const { width, height } = useWindowDimensions();

  // Responsive sizes
  const lottieSize = height > 900 ? 300 : height < 700 ? 150 : 190;
  const fontSize = width > 400 ? 49 : 30;
  const inputWidth = width > 380 ? 340 : 290;
  const inputHeight = 60;
  const buttonWidth = width > 380 ? 280 : 250;
  const buttonHeight = 50;

  const [email, setEmail] = useState("");

  // Email validation function
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGetOtp = () => {
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    // Simulate OTP request logic
    Alert.alert("OTP Sent", "An OTP has been sent to your email.");
    // Proceed with actual OTP request logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: "100%", marginTop: 30, paddingLeft: 20 }}>
        <Text style={[styles.name, { fontSize }]}>Forgot</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { fontSize }]}>Your</Text>
          <Text style={[styles.nameShaala, { fontSize }]}>Password?</Text>
        </View>
      </View>
      <LottieView
        style={[styles.lottie, { width: lottieSize, height: lottieSize }]}
        source={require("../../../src/assets/lottie/pizza.json")}
        autoPlay
        loop
      />
      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight }]}
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TouchableOpacity
        style={[styles.button, { width: buttonWidth, height: buttonHeight }]}
        onPress={handleGetOtp}
      >
        <Text style={{ color: "white", fontSize: 16 }}>Get OTP</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.linkText}>New User? Signup</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1c1c1c",
  },
  titleContainer: {
    flexDirection: "row",
  },
  name: {
    color: "white",
    fontFamily: "Poppins-Regular",
  },
  lottie: {
    marginTop: 20,
  },
  nameShaala: {
    color: "#FF6347", // Customize color for "Shaala"
    fontFamily: "Poppins-Regular",
    paddingLeft: 10,
  },
  input: {
    backgroundColor: "white",
    marginTop: 30,
    padding: 15,
    borderRadius: 50,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#FF6347",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  linkText: {
    color: "white",
    marginTop: 20,
    fontSize: 14,
  },
});

export default Forgot;
