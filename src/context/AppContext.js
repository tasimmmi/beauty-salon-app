import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [clients, setClients] = useState([]);
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const storedAppointments = await AsyncStorage.getItem('appointments');
      const storedMaterials = await AsyncStorage.getItem('materials');
      const storedClients = await AsyncStorage.getItem('clients');
      const storedFinances = await AsyncStorage.getItem('finances');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
      if (storedMaterials) setMaterials(JSON.parse(storedMaterials));
      if (storedClients) setClients(JSON.parse(storedClients));
      if (storedFinances) setFinances(JSON.parse(storedFinances));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // User methods
  const login = async (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Appointment methods
  const addAppointment = async (appointment) => {
  const newAppointment = {
    id: Date.now().toString(),
    ...appointment,
    createdAt: new Date().toISOString()
  };
  
  // Преобразуем время начала в минуты для удобства сравнения
  const [startHour, startMinute] = appointment.time.split(':').map(Number);
  const newStart = startHour * 60 + startMinute;
  const newEnd = newStart + appointment.duration;

  // Проверяем все существующие записи на выбранную дату
  const isAvailable = !appointments.some(existing => {
    // Проверяем только записи на ту же дату
    if (existing.date !== appointment.date) return false;

    // Преобразуем время существующей записи в минуты
    const [existHour, existMinute] = existing.time.split(':').map(Number);
    const existStart = existHour * 60 + existMinute;
    const existEnd = existStart + (existing.duration || 60); // если нет длительности, ставим 60 минут

    // Проверяем пересечение временных интервалов
    // Новый интервал пересекается с существующим, если:
    // - новое начало раньше конца существующего И новое окончание позже начала существующего
    const isOverlapping = (newStart < existEnd && newEnd > existStart);
    
    if (isOverlapping) {
      console.log(`Конфликт: ${appointment.time}-${newEnd} с ${existing.time}-${existEnd}`);
    }
    
    return isOverlapping;
  });

  if (isAvailable) {
    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    await AsyncStorage.setItem('appointments', JSON.stringify(updated));
    return true;
  }
  return false;
};

  // Material methods
  const addMaterial = async (material) => {
    const newMaterial = {
      id: Date.now().toString(),
      ...material,
      createdAt: new Date().toISOString()
    };
    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    await saveData('materials', updatedMaterials);
  };

  const updateMaterialQuantity = async (id, quantity) => {
    const updatedMaterials = materials.map(m => 
      m.id === id ? { ...m, quantity } : m
    );
    setMaterials(updatedMaterials);
    await saveData('materials', updatedMaterials);
  };

  // Client methods
  const addClient = async (client) => {
    const newClient = {
      id: Date.now().toString(),
      ...client,
      visits: [],
      createdAt: new Date().toISOString()
    };
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    await saveData('clients', updatedClients);
  };

  const addClientVisit = async (clientId, visit) => {
    const updatedClients = clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          visits: [...c.visits, { ...visit, id: Date.now().toString() }]
        };
      }
      return c;
    });
    setClients(updatedClients);
    await saveData('clients', updatedClients);
  };

  // Finance methods
  const addFinanceRecord = async (record) => {
    const newRecord = {
      id: Date.now().toString(),
      ...record,
      createdAt: new Date().toISOString()
    };
    const updatedFinances = [...finances, newRecord];
    setFinances(updatedFinances);
    await saveData('finances', updatedFinances);
  };

  const value = {
    currentUser,
    users,
    appointments,
    materials,
    clients,
    finances,
    loading,
    login,
    logout,
    addAppointment,
    addMaterial,
    updateMaterialQuantity,
    addClient,
    addClientVisit,
    addFinanceRecord,
    loadData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};