import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import IonIcons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';

const getBackendUrl = endpoint => {
  const baseUrl =
    Platform.OS === 'ios' ? 'http://localhost:2000' : 'http://10.0.2.2:2000';

  return `${baseUrl}/api/profile/${endpoint}`;
};

const getFullImageUrl = relativeUrl => {
  if (!relativeUrl || relativeUrl.trim() === '') return null;
  const baseUrl =
    Platform.OS === 'ios' ? 'http://localhost:2000' : 'http://10.0.2.2:2000';
  const normalizedPath = relativeUrl.startsWith('/')
    ? relativeUrl
    : `/${relativeUrl}`;
  return `${baseUrl}${normalizedPath}`;
};

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    height: '',
    weight: '',
    profilePhoto: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert('Please log in first');
          navigation.navigate('Login');
          return;
        }

        const response = await fetch(getBackendUrl('details'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Profile data from server:', data); // Debug log
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          weight: data.weight || '',
          height: data.height || '',
          profilePhoto: data.profilePhoto || '',
        });
        setImageError(false);
      } catch (error) {
        console.error('Error fetching profile:', error.message);
        Alert.alert('Error', 'Failed to load profile: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigation]);

  useEffect(() => {
    console.log('Current profile photo URL:', profile.profilePhoto);
    console.log('Full URL being used:', getFullImageUrl(profile.profilePhoto));
  }, [profile.profilePhoto]);

  const handleSave = async () => {
    if (!profile.name.trim()) {
      return Alert.alert('Error', 'Name cannot be empty');
    }

    if (!profile.email.trim()) {
      return Alert.alert('Error', 'Email cannot be empty');
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Please log in first');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(getBackendUrl('updateprofile'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error.message);
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChoosePhoto = () => {
    setPhotoModalVisible(true);
  };

  const launchCamera = () => {
    setPhotoModalVisible(false);

    ImagePicker.launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.7,
      },
      response => {
        handleImagePickerResponse(response);
      },
    );
  };

  const launchGallery = () => {
    setPhotoModalVisible(false);

    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.7,
      },
      response => {
        handleImagePickerResponse(response);
      },
    );
  };

  const handleImagePickerResponse = response => {
    console.log('Image picker response:', response);

    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      Alert.alert('Error', response.errorMessage);
    } else if (response.assets && response.assets.length > 0) {
      console.log('Selected image:', response.assets[0]);
      uploadPhoto(response.assets[0]);
    } else {
      console.log('No assets found in image picker response');
      Alert.alert('Error', 'No image selected');
    }
  };
  const uploadPhoto = async imageAsset => {
    setUploadingPhoto(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Please log in first');
        navigation.navigate('Login');
        return;
      }
  
      const formData = new FormData();
      formData.append('profilePhoto', {
        uri: Platform.OS === 'android' ? imageAsset.uri : imageAsset.uri.replace('file://', ''),
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'photo.jpg',
      });
  
      const response = await fetch(getBackendUrl('uploadphoto'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
  
      if (!response.ok) {
        console.error('Server error response:', responseText);
        throw new Error(`Failed to upload photo: ${responseText}`);
      }
  
      // Parse JSON safely
      let result = {};
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing server response:', e);
        throw new Error('Invalid response from server');
      }
  
      if (!result.photoUrl) {
        throw new Error('No photo URL returned from server');
      }
  
      // Update the profile photo in state
      setProfile(prev => ({
        ...prev,
        profilePhoto: result.photoUrl,
      }));
  
      setImageError(false); // Clear any previous errors
  
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading photo:', error.message);
      Alert.alert('Error', 'Failed to upload photo: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };
  

  const handleImageError = () => {
    console.error('Image load error occurred');
    setImageError(true);
    // Don't modify the profile state to prevent infinite re-renders
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6347" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getProfileImageSource = () => {
    console.log('Current profile photo path:', profile.profilePhoto);

    if (!profile.profilePhoto || imageError) {
      console.log('Using default image');
      return require('../../../src/assets/images/male.png');
    } else {
      const fullUrl = getFullImageUrl(profile.profilePhoto);
      console.log('Using image URL:', fullUrl);
      return {uri: fullUrl};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.topContainer}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleChoosePhoto}>
          <Image
            source={getProfileImageSource()}
            style={styles.image}
            onError={() => handleImageError()}
          />
          {uploadingPhoto && (
            <View style={styles.photoUploadOverlay}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <IonIcons name="camera" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.name}>My Profile</Text>
      <Text style={styles.subtitle}>Update your personal information</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.photoPreviewContainer}>
            <Text style={styles.photoPreviewLabel}>Profile Photo:</Text>
            {profile.profilePhoto && !imageError ? (
              <Image
                source={
                  profile.profilePhoto
                    ? {uri: getFullImageUrl(profile.profilePhoto)}
                    : require('../../../src/assets/images/male.png')
                }
                style={styles.profileImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.photoPreviewPlaceholder}>
                <Text style={styles.photoPreviewPlaceholderText}>
                  No Photo Selected
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={profile.name}
                onChangeText={text => setProfile({...profile, name: text})}
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={profile.email}
                onChangeText={text => setProfile({...profile, email: text})}
                style={styles.input}
                keyboardType="email-address"
                placeholder="Enter your email address"
                placeholderTextColor="#adb5bd"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                value={profile.phone}
                onChangeText={text => setProfile({...profile, phone: text})}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
                placeholderTextColor="#adb5bd"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height(in cm's)</Text>
              <TextInput
                value={profile.height}
                onChangeText={text => setProfile({...profile, height: text})}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="Enter your Height"
                placeholderTextColor="#adb5bd"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight(in kg's)</Text>
              <TextInput
                value={profile.weight}
                onChangeText={text => setProfile({...profile, weight: text})}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="Enter your Weight"
                placeholderTextColor="#adb5bd"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Profile Picture</Text>

            <TouchableOpacity style={styles.modalOption} onPress={launchCamera}>
              <IonIcons name="camera" size={24} color="#FF6347" />
              <Text style={styles.modalOptionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={launchGallery}>
              <IonIcons name="image" size={24} color="#FF6347" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setPhotoModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF6347',
    fontWeight: '500',
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  profileImageContainer: {
    position: 'relative',
    backgroundColor: 'gray',
    borderRadius: 10,
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 5.22,
    elevation: 8,
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  photoUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#FF6347',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    width: 45,
    height: 45,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  name: {
    paddingLeft: 20,
    paddingTop: 20,
    color: 'black',
    fontFamily: 'Poppins',
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    paddingLeft: 20,
    color: 'black',
    fontSize: 16,
    marginBottom: 20,
  },
  // New photo preview section
  photoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  photoPreviewLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginRight: 10,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6347',
  },
  photoPreviewPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6347',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewPlaceholderText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    padding: 5,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: 'black',
    borderWidth: 2,
    borderColor: '#FF6347',
  },
  saveButton: {
    backgroundColor: '#FF6347',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  modalOptionText: {
    fontSize: 16,
    color: 'black',
    marginLeft: 15,
  },
  modalCancelButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;
