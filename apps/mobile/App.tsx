import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 页面
import HomeScreen from './screens/HomeScreen';
import MarketScreen from './screens/MarketScreen';
import GeneDetailScreen from './screens/GeneDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import TrainingScreen from './screens/TrainingScreen';
import WalletConnectScreen from './screens/WalletConnectScreen';

// 组件
import TabBarIcon from './components/TabBarIcon';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Market" component={MarketScreen} options={{ title: '市场' }} />
      <Tab.Screen name="Training" component={TrainingScreen} options={{ title: '训练' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: '排行' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GeneDetail"
              component={GeneDetailScreen}
              options={{ title: '基因详情' }}
            />
            <Stack.Screen
              name="WalletConnect"
              component={WalletConnectScreen}
              options={{ title: '连接钱包', presentation: 'modal' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
