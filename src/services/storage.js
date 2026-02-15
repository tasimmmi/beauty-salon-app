import AsyncStorage from '@react-native-async-storage/async-storage';

export const initStorage = async () => {
  try {
    // Инициализация пользователей
    const users = await AsyncStorage.getItem('users');
    if (!users) {
      const defaultUsers = [
        {
          id: '1',
          username: 'anna',
          password: 'anna123',
          name: 'Анна',
          role: 'cosmetologist'
        },
        {
          id: '2',
          username: 'maria',
          password: 'maria123',
          name: 'Мария',
          role: 'cosmetologist'
        }
      ];
      await AsyncStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    // Инициализация пустых массивов для других данных
    const appointments = await AsyncStorage.getItem('appointments');
    if (!appointments) {
      await AsyncStorage.setItem('appointments', JSON.stringify([]));
    }

    const materials = await AsyncStorage.getItem('materials');
    if (!materials) {
      await AsyncStorage.setItem('materials', JSON.stringify([]));
    }

    const clients = await AsyncStorage.getItem('clients');
    if (!clients) {
      await AsyncStorage.setItem('clients', JSON.stringify([]));
    }

    const finances = await AsyncStorage.getItem('finances');
    if (!finances) {
      await AsyncStorage.setItem('finances', JSON.stringify([]));
    }

    console.log('Storage initialized successfully');
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Storage cleared successfully');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};