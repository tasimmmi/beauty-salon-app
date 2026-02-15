import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Alert, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';

import LoginScreen from '../screens/LoginScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import FinanceScreen from '../screens/FinanceScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs({ navigation }) {
  const { currentUser, logout } = useApp();

  const handleLogout = () => {
    Alert.alert(
      'Выход из системы',
      'Вы уверены, что хотите выйти?',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Выйти',
          onPress: () => {
            logout();
            navigation.replace('Login');
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Расписание') {
            iconName = 'schedule';
          } else if (route.name === 'Материалы') {
            iconName = 'inventory';
          } else if (route.name === 'Услуги') {
            iconName = 'spa'; // Изменил иконку для услуг
          } else if (route.name === 'Финансы') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'Отчеты') {
            iconName = 'assessment';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9C27B0',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#9C27B0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Добавляем кнопку выхода в правую часть заголовка
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ marginRight: 15, padding: 5 }}
          >
            <Icon name="exit-to-app" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Расписание" component={ScheduleScreen} />
      <Tab.Screen name="Услуги" component={ServicesScreen} />
      <Tab.Screen name="Материалы" component={MaterialsScreen} />
      <Tab.Screen name="Финансы" component={FinanceScreen} />
      <Tab.Screen name="Отчеты" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}