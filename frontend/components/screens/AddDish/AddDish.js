import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import axios from 'axios';

const AddDish = ({navigation}) => {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to get backend URL
  const getBaseUrl = () => {
    return Platform.OS === 'ios'
      ? 'http://localhost:2000'
      : 'http://10.0.2.2:2000';
  };

  // Select photo from gallery
  const selectFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'There was an error selecting the image.');
      } else if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0]);
      }
    });
  };

  // Take a photo with camera
  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        Alert.alert('Error', 'There was an error capturing the image.');
      } else if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0]);
      }
    });
  };

  // Show image selection options
  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {text: 'Take Photo', onPress: takePhoto},
        {text: 'Choose from Gallery', onPress: selectFromGallery},
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true},
    );
  };

  // Submit the dish
  const handleSubmit = async () => {
    if (!dishName.trim()) {
      Alert.alert('Error', 'Please enter title');
      return;
    }

    if (!photo) {
      Alert.alert('Error', 'Please add a photo of your thoughts');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      // Create form data
      const formData = new FormData();
      formData.append('dishName', dishName);
      formData.append('description', description);
      formData.append('category', category);

      // Append the photo
      formData.append('photo', {
        name: photo.fileName || `photo-${Date.now()}.jpg`,
        type: photo.type,
        uri:
          Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
      });

      // Send the request
      const response = await axios.post(
        `${getBaseUrl()}/api/community/post`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      Alert.alert('Success', 'Your thoughts has been shared with the community!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Tab1', { screen: 'Community' })
          ,
        },
      ]);
    } catch (error) {
      console.error('Error submitting thoughts:', error);
      Alert.alert('Error', 'Failed to share your thoughts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Categories for dish
  const categories = [
    'Chinese',
    'Indian',
    'Japanese',
    'Korean',
    'Italian',
    'Mexican',
    'Thai',
    'Greek',
    'French',
    'Spanish',
    'American',
    'Mediterranean',
    'Middle Eastern',
    'African',
    'Vietnamese',
    'Brazilian',
    'Peruvian',
    'Caribbean',
    'German',
    'British',
    'Other',
  ];

  // Render category button
  const renderCategoryButton = cat => (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoryButton,
        category === cat && styles.selectedCategory,
      ]}
      onPress={() => setCategory(cat)}>
      <Text
        style={[
          styles.categoryText,
          category === cat && styles.selectedCategoryText,
        ]}>
        {cat}
      </Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Your Thoughts</Text>
          <View style={{width: 28}} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={showImageOptions}>
            {photo ? (
              <Image source={{uri: photo.uri}} style={styles.dishPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={50} color="#ccc" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={dishName}
              onChangeText={setDishName}
              placeholder="Enter the title"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Eat an apple everyday to keep the doctor away"
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

         

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!dishName || !photo) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!dishName || !photo || loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Share with Community</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  photoContainer: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  dishPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'black',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 120,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    backgroundColor: '#FF6347',
    borderColor: '#FF6347',
  },
  categoryText: {
    color: '#444',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF6347',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ffaa99',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddDish;
