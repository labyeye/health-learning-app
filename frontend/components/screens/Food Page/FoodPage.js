import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import IonIcons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Platform} from 'react-native';

const FoodPage = ({route, navigation}) => {
  const {foodId, foodPreview} = route.params || {};
  const [food, setFood] = useState(foodPreview || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const {onLikeToggle} = route.params || {};

  const getBackendUrl = id => {
    const baseUrl =
      Platform.OS === 'ios' ? 'http://localhost:2000' : 'http://10.0.2.2:2000';

    return `${baseUrl}/api/food/${id}`;
  };

  const toggleLike = async () => {
    if (!userId || !food) return;

    try {
      setFood(prevFood => ({
        ...prevFood,
        liked: !prevFood.liked,
        likes: prevFood.liked ? prevFood.likes - 1 : prevFood.likes + 1,
      }));

      const baseUrl =
        Platform.OS === 'ios'
          ? 'http://localhost:2000'
          : 'http://10.0.2.2:2000';
      const likeUrl = `${baseUrl}/api/food/liked/${food._id}`;

      const token = await AsyncStorage.getItem('userToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      await axios.post(likeUrl, {userId}, config);
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Could not update like. Please try again.');

      setFood(prevFood => ({
        ...prevFood,
        liked: !prevFood.liked,
        likes: prevFood.liked ? prevFood.likes - 1 : prevFood.likes + 1,
      }));
    }
    if (onLikeToggle) {
      onLikeToggle(
        food._id,
        !food.liked,
        food.liked ? food.likes - 1 : food.likes + 1,
      );
    }
  };

  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.userId || payload.id || payload._id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!foodId && !foodPreview) {
        setError('No food ID provided');
        setLoading(false);
        return;
      }

      // Use foodPreview as initial state
      if (foodPreview) {
        setFood(foodPreview);
      }

      try {
        if (foodId) {
          setLoading(true);
          const token = await AsyncStorage.getItem('userToken');
          const config = token
            ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            : {};

          const response = await axios.get(getBackendUrl(foodId), config);

          // Preserve the liked status from foodPreview if it exists
          setFood(prevFood => {
            const newData = {...response.data};

            // If we already have a food with liked status, preserve that status
            if (prevFood && 'liked' in prevFood) {
              newData.liked = prevFood.liked;
              newData.likes = prevFood.likes;
            }

            return newData;
          });

          setError(null);
        }
      } catch (err) {
        console.error('Error fetching food details:', err);
        setError('Failed to load food details. Please try again.');
        if (!foodPreview) {
          setFood(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [foodId, foodPreview]);

  if (loading && !food) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6347" />
        <Text style={styles.loadingText}>Loading food details...</Text>
      </View>
    );
  }

  if (error && !food) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Food information not available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IonIcons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
          <View style={{width: 28}} />
        </View>

        {loading && food && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator size="small" color="#FF6347" />
          </View>
        )}

        <Image
          source={{uri: food.uri}}
          style={styles.foodImage}
          resizeMode="cover"
        />

        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.foodName}>{food.name}</Text>
            <TouchableOpacity onPress={toggleLike} style={styles.likeContainer}>
              <FontAwesome
                name={food.liked ? 'heart' : 'heart-o'}
                size={25}
                color={food.liked ? 'red' : 'black'}
              />
              <Text style={styles.likeCount}>{food.likes || 0}</Text>
            </TouchableOpacity>
          </View>

          {food.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{food.category}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {food.desc ||
              'No description available for this delicious dish. Try it to experience the flavor!'}
          </Text>

          {food.ingredients && food.ingredients.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ingredients</Text>

              {/* Marinade Section */}
              <Text style={styles.subsectionTitle}>
                For the Chicken Marinade:
              </Text>
              <View style={styles.ingredientsList}>
                {food.ingredients.slice(0, 9).map((ingredient, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <Text style={styles.ingredientItem}>
                      • {ingredient.name}
                      {ingredient.quantity ? ` (${ingredient.quantity})` : ''}
                      {ingredient.note ? ` - ${ingredient.note}` : ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gravy Section */}
              <Text style={styles.subsectionTitle}>
                For the Butter Chicken Gravy:
              </Text>
              <View style={styles.ingredientsList}>
                {food.ingredients.slice(9).map((ingredient, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <Text style={styles.ingredientItem}>
                      • {ingredient.name}
                      {ingredient.quantity ? ` (${ingredient.quantity})` : ''}
                      {ingredient.note ? ` - ${ingredient.note}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <IonIcons name="timer-outline" size={24} color="#FF6347" />
              <Text style={styles.detailText}>
                {food.time || '30 mins'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <IonIcons name="flame-outline" size={24} color="#FF6347" />
              <Text style={styles.detailText}>
                {food.calories || 'Unknown'} cal
              </Text>
            </View>
            <View style={styles.detailItem}>
              <IonIcons name="star-outline" size={24} color="#FF6347" />
              <Text style={styles.detailText}>
                Rating: {food.rating || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  refreshIndicator: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 5,
    borderRadius: 15,
  },
  foodImage: {
    width: '100%',
    height: 250,
  },
  infoContainer: {
    padding: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 16,
    color: 'black',
    marginLeft: 5,
  },
  categoryTag: {
    backgroundColor: '#fcc5bb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  categoryText: {
    color: 'black',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 15,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  ingredientsList: {
    marginLeft: 10,
  },
  ingredientItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailItem: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  detailText: {
    marginTop: 5,
    fontSize: 14,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 5,
  },
});

export default FoodPage;
