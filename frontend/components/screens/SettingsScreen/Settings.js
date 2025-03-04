import React from 'react';
import {View, Text, Button, Alert, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const getBackendUrl = (endpoint) => {
  // Updated to use the correct auth path
  const baseUrl = Platform.OS === 'ios' 
    ? 'http://localhost:2000' 
    : 'http://10.0.2.2:2000';  
  
  return `${baseUrl}/api/auth/${endpoint}`;  
};

const Settings = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Already logged out');
        return;
      }
      
      // Debug log to verify URL
      const url = getBackendUrl('logout');
      console.log('Attempting logout with URL:', url);
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      const contentType = response.headers.get('content-type');
      let responseBody;
      
      try {
        responseBody = contentType && contentType.includes('application/json')
          ? await response.json()
          : await response.text();
      } catch (e) {
        console.error('Error parsing response:', e);
        responseBody = await response.text();
      }
  
      if (!response.ok) {
        console.error('Server error:', responseBody);
        throw new Error(typeof responseBody === 'object' && responseBody.message 
          ? responseBody.message 
          : 'Logout failed');
      }
  
      await AsyncStorage.removeItem('userToken');
  
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error.message);
      Alert.alert('Logout failed. Please try again.');
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Settings Screen</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default Settings;