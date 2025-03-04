import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import IonIcons from 'react-native-vector-icons/Ionicons';

const ChatGpt = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Load user ID and chat history when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user ID directly from AsyncStorage instead of using JWT token
        const storedUserId = await AsyncStorage.getItem('userId');
        
        if (storedUserId) {
          setUserId(storedUserId);
          loadChatHistory(storedUserId);
        } else {
          // Fallback: Try to manually decode the token if userId isn't stored directly
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            // Simple JWT decode without library
            try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const decodedToken = JSON.parse(jsonPayload);
              const id = decodedToken.userId || decodedToken.id || decodedToken._id;
              
              if (id) {
                setUserId(id);
                // Save userId for future use
                await AsyncStorage.setItem('userId', id);
                loadChatHistory(id);
              } else {
                console.log('No user ID found in token');
              }
            } catch (decodeError) {
              console.error('Error decoding token:', decodeError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Load chat history from backend
  const loadChatHistory = async (id) => {
    try {
      setIsLoading(true);
      
      // Add proper error handling with full URL logging
      const url = getChatHistoryUrl(id);
      console.log('Attempting to fetch chat history from:', url);
      
      const response = await axios.get(url);
      console.log('Chat history response:', response.status);
      
      setMessages(response.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chat history:', error);
      console.error('Status code:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      setIsLoading(false);
      
      setMessages([]);
    }
  };
  
  
  const getChatHistoryUrl = (id) => {
    const baseUrl = Platform.OS === 'ios' 
      ? 'http://localhost:2000/api/chat'
      : 'http://10.0.2.2:2000/api/chat';
    return `${baseUrl}/history/${id}`;
  };
  const getMessageUrl = () => {
    return Platform.OS === 'ios'
      ? 'http://localhost:2000/api/chat/message'
      : 'http://10.0.2.2:2000/api/chat/message';
  };

  // Function to safely get user ID
  const getUserId = async () => {
    if (userId) return userId;
    
    // Try to get from AsyncStorage
    const storedId = await AsyncStorage.getItem('userId');
    if (storedId) return storedId;
    
    return null;
  };

  // Send message to backend
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      // Get the userId - will use the state or try to fetch it again
      const currentUserId = await getUserId();
      
      if (!currentUserId) {
        console.error('No user ID available');
        return;
      }
      
      // Add user message to UI immediately
      const userMessage = {
        _id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        createdAt: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setNewMessage('');
      setIsLoading(true);
      
      // Get token for authorization
      const token = await AsyncStorage.getItem('userToken');
      
      // Send message to backend
      const response = await axios.post(
        getMessageUrl(),
        {
          userId: currentUserId,
          message: newMessage
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Add AI response to UI
      if (response.data && response.data.reply) {
        const aiMessage = {
          _id: Date.now().toString() + 1,
          text: response.data.reply,
          sender: 'ai',
          createdAt: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  // Render each message
  const renderMessage = ({ item }) => (
    <View 
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.aiBubble
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Assistant</Text>
      </View>
      
      {messages.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <IonIcons name="chatbubble-ellipses-outline" size={50} color="#FF6347" />
          <Text style={styles.emptyStateText}>
            Ask me anything about food recipes, cooking tips, or dietary advice!
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.messageList}
          inverted={false}
        />
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6347" />
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Ask about food..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={sendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          <FontAwesome 
            name="send" 
            size={20} 
            color={newMessage.trim() ? "#fff" : "#ccc"} 
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FF6347',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  messageList: {
    padding: 15,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#FF6347',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#777',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FF6347',
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default ChatGpt;