import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import axios from 'axios';
// Import icons from a compatible library (assuming react-native-vector-icons is installed)
// If not installed, you'll need to run: npm install react-native-vector-icons
// Then link: npx react-native link react-native-vector-icons
import Icon from 'react-native-vector-icons/Ionicons';

const getBackendUrl = endpoint => {
  const baseUrl =
    Platform.OS === 'ios' ? 'http://localhost:2000' : 'http://10.0.2.2:2000';

  return `${baseUrl}/api/tips/${endpoint}`;
};

const Tips = ({navigation}) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTips = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(getBackendUrl('tips'));
      setTips(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tips. Please try again later.');
      setLoading(false);
      console.error('Error fetching tips:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTips();
    setRefreshing(false);
  };

  const handleAddTip = () => {
    // Navigate to add tip screen
    navigation.navigate('AddTip');
  };

  const handleGoBack = () => {
    // Go back to previous screen
    navigation.goBack();
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const renderTipItem = ({item}) => (
    <TouchableOpacity
      style={styles.tipCard}
      onPress={() => {
        // Handle navigation to tip details if needed
        navigation.navigate('TipDetails', {tipId: item._id});
      }}>
      {item.photo ? (
        <Image
          source={{uri: item.photo}}
          style={styles.tipImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{item.title}</Text>
        <Text style={styles.tipDescription} numberOfLines={3}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading tips...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTips}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.header}>Daily Tips</Text>
      </View>

      <FlatList
        data={tips}
        keyExtractor={item => item._id || item.id.toString()}
        renderItem={renderTipItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tips available</Text>
            <TouchableOpacity
              style={styles.addFirstTipButton}
              onPress={handleAddTip}>
              <Text style={styles.addFirstTipText}>Add your first tip</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },

  header: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight:40,
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    height: 'auto',
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipImage: {
    width: '100%',
    height: 150,
  },
  tipContent: {
    padding: 15,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  centered: {
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
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  addFirstTipButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  addFirstTipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Tips;
