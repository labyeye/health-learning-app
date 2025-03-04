import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './components/screens/HomeScreen/Home';
import Login from './components/screens/LoginScreen/LoginScreen';
import Signup from './components/screens/SignUpScreen/SignUpScreen';
import Forgot from './components/screens/ForgotPassword/ForgotPassword';
import Dashboard from './components/screens/DashBoard/Dashboard';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import IonIcons from 'react-native-vector-icons/Ionicons';
import ChatGpt from './components/screens/ChatGpt/ChatGpt';
import Settings from './components/screens/SettingsScreen/Settings';
import Profile from './components/screens/Profile/Profile';
import FoodPage from './components/screens/Food Page/FoodPage';
import Community from './components/screens/Community/Community';
import AddDish from './components/screens/AddDish/AddDish';
import Tips from './components/screens/Tips/Tips';
import ModulesScreen from './components/screens/Modules/Module';
import Feather from 'react-native-vector-icons/Feather';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DashboardTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Tab1"
      component={Dashboard}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <IonIcons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Community"
      component={Community}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <IonIcons name="people-circle-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Goal"
      component={Community}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Feather name="target" size={size} color={color} />
        ),
      }}
    />
    
    <Tab.Screen
      name="Settings"
      component={Settings}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <IonIcons name="settings-outline" size={size} color={color} />
        ),
      }}
    />
    
  </Tab.Navigator>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Tab1' : 'Home'} // Conditional routing
      >
        <Stack.Screen
          name="Home"
          component={Home}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SignUp"
          component={Signup}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Forgot"
          component={Forgot}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Tab1"
          component={DashboardTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FoodPage"
          component={FoodPage}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddDish"
          component={AddDish}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Tips"
          component={Tips}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ModuleScreen"
          component={ModulesScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
