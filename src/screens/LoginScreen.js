import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, users, loadData } = useApp();

  useEffect(() => {
    initializeUsers();
  }, []);

  const initializeUsers = async () => {
    const storedUsers = await AsyncStorage.getItem('users');
    if (!storedUsers) {
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
      await loadData();
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigation.replace('Main');
    } else {
      Alert.alert('Ошибка', 'Неверное имя пользователя или пароль');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Beauty Salon</Text>
        <Text style={styles.subtitle}>Вход в систему</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Имя пользователя"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Войти</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Тестовые учетные записи:</Text>
          <Text style={styles.infoText}>anna / anna123</Text>
          <Text style={styles.infoText}>maria / maria123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9C27B0',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40
  },
  inputContainer: {
    marginBottom: 20
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16
  },
  loginButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20
  },
  loginButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600'
  },
  infoContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5
  }
});