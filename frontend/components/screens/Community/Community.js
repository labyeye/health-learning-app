import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import axios from 'axios';

const Community = ({navigation}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const getBaseUrl = () => {
    return Platform.OS === 'ios'
      ? 'http://localhost:2000'
      : 'http://10.0.2.2:2000';
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getBaseUrl()}/api/community/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching community posts:', error);
      Alert.alert('Error', 'Could not load community posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const getUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const decodedToken = jwtDecode(token);
        const id =
          decodedToken.userId ||
          decodedToken.id ||
          decodedToken._id ||
          decodedToken.sub;
        setUserId(id);
        return id;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  const toggleLike = async postId => {
    try {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? post.likes - 1 : post.likes + 1,
              }
            : post,
        ),
      );

      const token = await AsyncStorage.getItem('userToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      await axios.post(
        `${getBaseUrl()}/api/community/like/${postId}`,
        {userId},
        config,
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Could not update like. Please try again.');

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? post.likes + 1 : post.likes - 1,
              }
            : post,
        ),
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await getUserId();
      fetchPosts();
    };

    loadData();
  }, []);

  const renderPostItem = ({item}) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image
          source={
            item.userPhoto
              ? {
                  uri: `${getBaseUrl()}${
                    item.userPhoto.startsWith('/')
                      ? item.userPhoto
                      : `/${item.userPhoto}`
                  }`,
                }
              : require('../../../src/assets/images/male.png')
          }
          style={styles.userAvatar}
        />
        <Text style={styles.userName}>{item.userName || 'User'}</Text>
      </View>

      <Image
        source={{
          uri: `${getBaseUrl()}${
            item.photoUrl.startsWith('/') ? item.photoUrl : `/${item.photoUrl}`
          }`,
        }}
        style={styles.dishImage}
        resizeMode="cover"
      />

      <View style={styles.postContent}>
        <Text style={styles.dishName}>{item.dishName}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.category}>{item.category}</Text>

        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleLike(item._id)}>
            <FontAwesome
              name={item.liked ? 'heart' : 'heart-o'}
              size={24}
              color={item.liked ? 'red' : 'black'}
            />
            <Text style={styles.likeCount}>{item.likes || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => navigation.navigate('Comments', {postId: item._id})}>
            <FontAwesome name="comment-o" size={24} color="black" />
            <Text style={styles.commentCount}>{item.commentCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Thoughts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddDish')}>
            <Ionicons name="add-circle" size={30} color="#FF6347" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#FF6347"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={item => item._id}
            renderItem={renderPostItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6347']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No community thoughts yet.</Text>
                <Text style={styles.emptySubText}>
                  Be the first to share your thoughts!
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddDish')}>
                  <Text style={styles.emptyButtonText}>Add Your Thoughts</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  addButton: {
    padding: 5,
  },
  postContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  dishImage: {
    width: '100%',
    height: 300,
  },
  postContent: {
    padding: 15,
  },
  dishName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 15,
  },
  interactionContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 5,
    fontSize: 16,
    color: 'black',
  },
  commentCount: {
    marginLeft: 5,
    fontSize: 16,
    color: 'black',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 16,
    color: '#444',
    marginBottom: 15,
  },
});

export default Community;
