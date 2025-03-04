import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
  Platform,
  Animated,
  TextInput,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 18; // Slightly wider cards with less padding

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Simple text-based icon component to replace vector icons
const TextIcon = ({ name, size, color, style }) => {
  // Map icon names to unicode symbols or text representations
  const iconMap = {
    'search': '🔍',
    'clear': '✕',
    'account': '👤',
    'error': '⚠️',
    'date': '📅',
    'expand-more': '▼',
    'expand-less': '▲',
    'search-off': '🔍✕',
  };

  return (
    <Text style={[{ fontSize: size, color: color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

const ModulesScreen = ({ navigation }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const getBaseUrl = () => {
        return Platform.OS === 'ios'
          ? 'http://localhost:2000'
          : 'http://10.0.2.2:2000';
      };
      
      const response = await axios.get(`${getBaseUrl()}/api/modules`);
      setModules(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchModules();
  }, []);

  // Extract unique categories for filter
  const categories = ['All', ...new Set(modules.map(module => module.category || 'Uncategorized'))];
  
  // Filter modules by selected category and search text
  const filteredModules = modules
    .filter(module => selectedCategory === 'All' || module.category === selectedCategory)
    .filter(module => {
      if (!searchText) return true;
      const searchLower = searchText.toLowerCase();
      return (
        module.title.toLowerCase().includes(searchLower) ||
        (module.description && module.description.toLowerCase().includes(searchLower))
      );
    });

  const renderCategoryPill = (category) => {
    const isSelected = category === selectedCategory;
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryPill,
          isSelected && styles.selectedCategoryPill
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[
          styles.categoryPillText,
          isSelected && styles.selectedCategoryPillText
        ]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderModuleCard = ({ item, index }) => {
    const initials = item.title.substring(0, 2).toUpperCase();
    const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Animation for card press
    const scaleAnim = new Animated.Value(1);
    
    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    };
    
    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    };

    // Calculate different colors based on index
    const getCardAccentColor = (id, index) => {
      const colors = [
        '#4F46E5', '#3B82F6', '#10B981', '#F59E0B', 
        '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'
      ];
      // Use index to create color patterns (odds/evens)
      return colors[index % colors.length];
    };

    const accentColor = getCardAccentColor(item._id, index);

    return (
      <AnimatedTouchable 
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] }
        ]}
        onPress={() => navigation.navigate('ModuleDetails', { moduleId: item._id })}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Course Image */}
        <View style={styles.imageContainer}>
          {item.photo ? (
            <Image 
              source={{ uri: item.photo }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: accentColor }]}>
              <Text style={styles.placeholderText}>{initials}</Text>
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.categoryText}>{item.category || 'Uncategorized'}</Text>
          </View>
        </View>
        
        {/* Course Content */}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <TextIcon name="date" size={12} color="#9CA3AF" style={styles.dateIcon} />
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.viewButton, { backgroundColor: accentColor }]}
              onPress={() => navigation.navigate('ModuleDetails', { moduleId: item._id })}
            >
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedTouchable>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <TextIcon name="error" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchModules}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Courses</Text>
          <Text style={styles.headerSubtitle}>Expand your knowledge with our professional courses</Text>
        </View>
        
      </View>
      
      <View style={styles.searchContainer}>
        <TextIcon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
            <TextIcon name="clear" size={18} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.categoryContainer}>
        <TouchableOpacity 
          style={styles.categoryToggleButton}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text style={styles.categoryToggleText}>
            {showCategories ? 'Hide Categories' : 'Show Categories'}
          </Text>
          <TextIcon 
            name={showCategories ? "expand-less" : "expand-more"} 
            size={14} 
            color="#FF6347" 
            style={styles.toggleIcon}
          />
        </TouchableOpacity>
        
        {showCategories && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryPillContainer}>
              {categories.map(renderCategoryPill)}
            </View>
          </ScrollView>
        )}
      </View>

      {filteredModules.length === 0 && !loading && (
        <View style={styles.noResultsContainer}>
          <TextIcon name="search-off" size={48} color="#9CA3AF" />
          <Text style={styles.noResultsTitle}>No courses found</Text>
          <Text style={styles.noResultsText}>
            {searchText 
              ? `No results for "${searchText}".`
              : selectedCategory !== 'All' 
                ? `No courses available in "${selectedCategory}".` 
                : 'No courses available at the moment.'}
          </Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => { 
              setSelectedCategory('All');
              setSearchText('');
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredModules}
        renderItem={renderModuleCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListHeaderComponent={
          filteredModules.length > 0 ? (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {filteredModules.length} {filteredModules.length === 1 ? 'course' : 'courses'} found
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6347',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FF6347',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6347',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
    backgroundColor: '#FF6347',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  categoryContainer: {
    marginTop: 16,
  },
  categoryToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryToggleText: {
    color: '#FF6347',
    fontWeight: '600',
    marginRight: 4,
  },
  toggleIcon: {
    marginTop: 2,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryPillContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryPill: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryPill: {
    backgroundColor: '#FF6347',
    borderColor: '#FF6347',
  },
  categoryPillText: {
    color: '#FF6347',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedCategoryPillText: {
    color: 'white',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#FF6347',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#FF6347',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#FF6347',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ModulesScreen;