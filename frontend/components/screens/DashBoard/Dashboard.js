import React, {useState, useEffect} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {jwtDecode} from 'jwt-decode';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  View,
  Image,
  ScrollView,
  FlatList,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import IonIcons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {TextInput} from 'react-native-gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

const Dashboard = ({route, navigation}) => {
  const {width} = useWindowDimensions();
  const {name = 'User'} = route.params || {};
  const [category, setCategory] = useState('All');
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [challenges] = useState([
    {
      id: '1',
      title: '7-Day Healthy Eating Challenge 🌿',
      duration: '5 Days Left',
      color: '#FF6347',
    },
    {
      id: '2',
      title: 'Step-Up: 10,000 Steps a Day 🚶‍♂️',
      duration: '3 Days Left',
      color: '#FF8C00',
    },
    {
      id: '3',
      title: 'Morning Meditation Challenge 🧘',
      duration: '7 Days Left',
      color: '#4682B4',
    },
    {
      id: '4',
      title: 'Water Intake Tracker 💧',
      duration: '2 Days Left',
      color: '#32CD32',
    },
    {
      id: '5',
      title: 'Sleep Better Challenge 😴',
      duration: '6 Days Left',
      color: '#9370DB',
    },
  ]);

  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            const decodedToken = jwtDecode(token);
            const userId =
              decodedToken.userId || decodedToken.id || decodedToken._id;
            setUserId(userId);

            const url = getBackendUrl('details');
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();

            // Construct full photo URL
            const getFullImageUrl = relativeUrl => {
              if (!relativeUrl || relativeUrl.trim() === '') return null;
              const baseUrl =
                Platform.OS === 'ios'
                  ? 'http://localhost:2000'
                  : 'http://10.0.2.2:2000';
              const normalizedPath = relativeUrl.startsWith('/')
                ? relativeUrl
                : `/${relativeUrl}`;
              return `${baseUrl}${normalizedPath}`;
            };

            setUserPhoto(
              userData?.profilePhoto
                ? getFullImageUrl(userData.profilePhoto)
                : null,
            );
            navigation.setParams({name: userData?.name || 'User'});

            console.log('Fetched user photo URL:', userPhoto);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };

      loadUserData();

      return () => {
        // Clean up if needed
      };
    }, []),
  );

  const handleSearch = text => {
    setSearchTerm(text);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const headerWidth = width > 400 ? 410 : width > 380 ? 350 : 335;
  const headerHeight = width > 400 ? 140 : width > 380 ? 120 : 100;
  const fontSize = width > 400 ? 39 : 30;
  const iconSize = width > 400 ? 30 : width > 380 ? 25 : 25;
  const imageSize = width > 400 ? 55 : width > 380 ? 45 : 35;
  const foodItemWidth = width > 400 ? 170 : width > 380 ? 165 : 155;
  const foodItemHeight = width > 400 ? 220 : width > 380 ? 230 : 210;
  const foodImageWidth = width > 400 ? 170 : width > 380 ? 165 : 155;
  const foodImageHeight = width > 400 ? 155 : width > 380 ? 170 : 160;

  const getBackendUrl = (endpoint = '') => {
    const baseUrl =
      Platform.OS === 'ios' ? 'http://localhost:2000' : 'http://10.0.2.2:2000';

    if (endpoint === 'details') {
      return `${baseUrl}/api/profile/details`;
    } else {
      return `${baseUrl}/api/food/category/${category}`;
    }
  };

  const getBackendLike = id => {
    if (Platform.OS === 'ios') {
      return `http://localhost:2000/api/food/liked/${id}`;
    } else {
      return `http://10.0.2.2:2000/api/food/liked/${id}`;
    }
  };

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log('Decoded token:', decodedToken); // Debug log to see token structure
          setUserId(decodedToken.userId || decodedToken.id || decodedToken._id);
        }
      } catch (error) {
        console.error('Error loading user ID:', error);
      }
    };

    loadUserId();
  }, []);

  const getUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const decodedToken = jwtDecode(token);
        console.log('Token structure:', decodedToken); // Debug to see token structure
        // Try different common ID field names
        return (
          decodedToken.userId ||
          decodedToken.id ||
          decodedToken._id ||
          decodedToken.sub
        );
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };
  
  const renderChallengeItem = ({item}) => (
    <View style={[styles.challengeCard, {backgroundColor: item.color}]}>
      <Text style={styles.challengeTitle}>{item.title}</Text>
      <Text style={styles.challengeDuration}>{item.duration}</Text>
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() =>
          Alert.alert('Join Challenge', `You joined the ${item.title}`)
        }>
        <Text style={styles.joinButtonText}>Join Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFoodItem = ({item}) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('FoodPage', {
          foodId: item._id,
          foodPreview: item,
          onLikeToggle: (id, liked, likesCount) => {
            // Update the foods state with new like information
            setFoods(prevFoods =>
              prevFoods.map(food =>
                food._id === id
                  ? {
                      ...food,
                      liked: liked,
                      likes: likesCount,
                    }
                  : food,
              ),
            );
          },
        })
      }
      style={[styles.foodItem, {width: foodItemWidth, height: foodItemHeight}]}>
      <Image
        source={{uri: item.uri}}
        style={[
          styles.foodImage,
          {width: foodImageWidth, height: foodImageHeight},
        ]}
      />
      <View
        style={{
          width: '100%',
          padding: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <View style={styles.foodInfoContainer}>
          <Text style={styles.foodName}>{item.name}</Text>
        </View>
        <View style={styles.likeContainer}>
          <Pressable
            onPress={e => {
              e.stopPropagation(); // Prevent navigation when pressing the heart
              toggleLike(item._id);
            }}>
            <FontAwesome
              name={item.liked ? 'heart' : 'heart-o'}
              size={25}
              color={item.liked ? 'red' : 'black'}
            />
          </Pressable>
          <Text style={styles.likeCount}>{item.likes || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Fixed header elements outside ScrollView */}
        <View style={styles.topContainer}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              backgroundColor: 'gray',
              borderRadius: 10,
            }}
            onPress={() => navigation.navigate('Profile')}>
            <Image
              source={
                userPhoto
                  ? {uri: userPhoto}
                  : require('../../../src/assets/images/male.png')
              }
              style={[styles.image, {width: imageSize, height: imageSize}]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.notificationIcon,
              {width: imageSize, height: imageSize},
            ]}
            onPress={() =>
              Alert.alert('Notifications', 'You have no new notifications.')
            }>
            <IonIcons
              name="notifications-sharp"
              size={iconSize}
              color={'black'}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.name, {fontSize}]}>Welcome, {name}!</Text>
        
        {/* Scrollable content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 20,
            }}>
            <View
              style={[
                styles.searchButton,
                {flex: 1, flexDirection: 'row', alignItems: 'center'},
              ]}>
              <TextInput
                placeholder="Search Module"
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={handleSearch}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}>
                  <IonIcons name="close-circle" size={20} color={'gray'} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={[styles.filterButton, {marginLeft: 10}]}>
              <IonIcons name="filter" size={iconSize} color={'black'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryButtons}>
            <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate('Tips')}>
              <IonIcons name="bulb" size={iconSize} color={'black'} />
              <Text
                style={{
                  width: '100%',
                  height: 'auto',
                  alignSelf: 'center',
                  textAlign: 'center',
                  borderRadius: 10,
                  marginTop: 10,
                  fontSize: 10,
                }}>
                Daily Tips
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <IonIcons name="medal" size={iconSize} color={'black'} />
              <Text
                style={{
                  width: '100%',
                  height: 'auto',
                  alignSelf: 'center',
                  textAlign: 'center',
                  borderRadius: 10,
                  marginTop: 10,
                  fontSize: 10,
                }}>
                Wellness Challenges
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate('ModuleScreen')}>
              <IonIcons name="book" size={iconSize} color={'black'} />
              <Text
                style={{
                  width: '100%',
                  height: 'auto',
                  alignSelf: 'center',
                  textAlign: 'center',
                  borderRadius: 10,
                  marginTop: 10,
                  fontSize: 10,
                }}>
                Interactive Modules
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryButtons1}>
            <TouchableOpacity style={styles.categoryButton1}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <FontAwesome5 name="dumbbell" size={20} color={'black'} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton1}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <FontAwesome5 name="apple-alt" size={20} color={'black'} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton1}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <FontAwesome5 name="brain" size={20} color={'black'} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton1}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <IonIcons name="heart" size={20} color={'black'} />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Challenges section with proper spacing */}
          <View style={styles.challengesSection}>
            <Text style={styles.sectionTitle}>Challenges</Text>
            <FlatList
              horizontal
              data={challenges}
              renderItem={renderChallengeItem}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.challengesList}
              style={styles.challengesFlatList}
            />
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Your Progress</Text>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarWrapper}>
                <View
                  style={[styles.progressBar, {width: `${(3 / 8) * 100}%`}]}
                />
              </View>
              <Text style={styles.progressText}>
                3 out of 8 modules completed
              </Text>
            </View>

            <View style={styles.badgeContainer}>
              <View style={styles.currentBadge}>
                <FontAwesome5 name="medal" size={30} color="#FFD700" />
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeLabel}>Current Badge</Text>
                  <Text style={styles.badgeName}>Mindfulness Master 🧘</Text>
                </View>
              </View>

              <View style={styles.nextGoalContainer}>
                <Text style={styles.nextGoalLabel}>Next Goal</Text>
                <Text style={styles.nextGoalText}>
                  Complete 2 more modules to earn your next badge!
                </Text>
                <TouchableOpacity style={styles.continueButton}>
                  <Text style={styles.continueButtonText}>Continue Learning</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Add some padding at the bottom to ensure everything is visible */}
          <View style={styles.bottomPadding} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30, // Add padding to ensure content is not cut off
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
    zIndex: 1,
  },
  image: {
    borderRadius: 10,
    resizeMode: 'cover',
  },
  notificationIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
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
    paddingBottom: 10,
    color: 'black',
    fontFamily: 'Poppins',
  },
  searchButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    height: 40,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  searchInput: {
    color: 'black',
    fontSize: 14,
    flex: 1,
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    backgroundColor: '#FF6347',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  categoryButtons1: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 30,
    borderColor: '#FF6347',
    borderWidth: 2,
    height: 105,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
   
  },
  categoryButton1: {
    borderRadius: 30,
    backgroundColor: '#FF6347',
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 1.22,
  },
  selectedCategory: {
    backgroundColor: '#fcc5bb',
  },
  categoryButtonText: {
    color: 'black',
    fontSize: 16,
  },
  // Challenge section styling
  challengesSection: {
    marginVertical: 15,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
  },
  challengesFlatList: {
    marginBottom: 15,
  },
  challengesList: {
    paddingRight: 20,
  },
  challengeCard: {
    width: 240,
    height: 150,
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 5.22,
    elevation: 8,
  },
  challengeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  challengeDuration: {
    color: 'white',
    fontSize: 14,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  joinButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarWrapper: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#32CD32',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  badgeContainer: {
    marginTop: 5,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 10,
  },
  badgeTextContainer: {
    marginLeft: 15,
  },
  badgeLabel: {
    fontSize: 14,
    color: '#666',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  nextGoalContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 15,
  },
  nextGoalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  nextGoalText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 15,
  },
  continueButton: {
    backgroundColor: '#4682B4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  foodItem: {
    alignItems: 'center',
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.22,
    shadowRadius: 9.22,
    elevation: 12,
  },
  foodImage: {
    borderRadius: 10,
    resizeMode: 'cover',
  },
  foodName: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  foodDesc: {
    color: 'black',
    fontSize: 14,
    textAlign: 'center',
  },
  foodInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '82%',
  },
  likeContainer: {
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 16,
    color: 'black',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 30,
  },
});

export default Dashboard;