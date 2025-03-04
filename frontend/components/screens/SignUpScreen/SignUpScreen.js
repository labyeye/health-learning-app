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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Signup = ({ navigation }) => {
  const { width, height } = useWindowDimensions();

  // State variables
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // Responsive sizes
  const lottieSize = height > 900 ? 350 : height < 700 ? 150 : 190;
  const fontSize = width > 400 ? 49 : 30;
  const inputWidth = width > 380 ? 340 : 290;
  const inputHeight = 40;
  const buttonWidth = width > 380 ? 280 : 250;
  const buttonHeight = 50;

  // Validation helper functions
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhoneNumber = (phone) => /^[0-9]{10}$/.test(phone);

  const handleSubmit = async () => {
    // Input validations
    if (!isValidEmail(email)) {
      setError("Invalid email address.");
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      setError("Phone number must be 10 digits.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
  
    // Clear error before API call
    setError("");
  
    try {
      const res = await axios.post("http://localhost:2000/api/auth/signup", {
        name,
        email,
        phone: phoneNumber,
        password,
        confirmPassword,
      });
      console.log(res.data);
      Alert.alert("Success", "You have successfully signed up!");
      AsyncStorage.setItem("userToken", res.data.token);
      navigation.navigate("Login");
    } catch (err) {
      console.error(err.response?.data);
      setError(err.response?.data?.message || "Server error. Please try again.");
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.name, { fontSize }]}>Sign</Text>
        <Text style={[styles.nameShaala, { fontSize }]}>Up</Text>
      </View>

      <LottieView
        style={[styles.lottie, { width: lottieSize, height: lottieSize }]}
        source={require("../../../src/assets/lottie/pizza.json")}
        autoPlay
        loop
      />
      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight }]}
        placeholder="Enter Name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        keyboardType="email-address"
        accessibilityLabel="Email Address"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight }]}
        placeholder="Enter Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        accessibilityLabel="Email Address"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight }]}
        placeholder="Phone Number"
        placeholderTextColor="#999"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        accessibilityLabel="Phone Number"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight }]}
        placeholder="Enter Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight }]}
        placeholder="Confirm Password"
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        accessibilityLabel="Confirm Password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, { width: buttonWidth, height: buttonHeight }]}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already a User? Login now</Text>
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
  headerContainer: {
    width: "100%",
    marginTop: 30,
    paddingLeft: 20,
    flexDirection: "row",
  },
  name: {
    color: "white",
    fontFamily: "Poppins-Regular",
  },
  nameShaala: {
    color: "#FF6347",
    fontFamily: "Poppins-Regular",
  },
  lottie: {
    marginTop: 20,
  },
  input: {
    backgroundColor: "white",
    marginTop: 20,
    paddingHorizontal: 15,
    borderRadius: 50,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#FF6347",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  linkText: {
    color: "white",
    marginTop: 20,
    fontSize: 14,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});

export default Signup;
