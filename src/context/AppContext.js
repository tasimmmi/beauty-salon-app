import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext({});

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [services, setServices] = useState([]);
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, appointmentsData, materialsData, servicesData, financesData] = await Promise.all([
        AsyncStorage.getItem('users'),
        AsyncStorage.getItem('appointments'),
        AsyncStorage.getItem('materials'),
        AsyncStorage.getItem('services'),
        AsyncStorage.getItem('finances')
      ]);

      if (usersData) setUsers(JSON.parse(usersData));
      if (appointmentsData) setAppointments(JSON.parse(appointmentsData));
      if (materialsData) setMaterials(JSON.parse(materialsData));
      if (servicesData) setServices(JSON.parse(servicesData));
      if (financesData) setFinances(JSON.parse(financesData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Функция для проверки доступности времени с учетом длительности
  const checkTimeAvailability = (date, startTime, duration) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const newStart = startHour * 60 + startMinute;
    const newEnd = newStart + duration;

    // Проверяем все записи на эту дату
    const conflictingAppointments = appointments.filter(existing => {
      if (existing.date !== date) return false;

      const [existHour, existMinute] = existing.time.split(':').map(Number);
      const existStart = existHour * 60 + existMinute;
      const existEnd = existStart + (existing.duration || 60);

      // Проверяем пересечение интервалов
      return (newStart < existEnd && newEnd > existStart);
    });

    return {
      available: conflictingAppointments.length === 0,
      conflictingAppointments
    };
  };

  // Функция для поиска доступных слотов с учетом длительности
  const findAvailableSlots = (date, duration, timeSlots) => {
    const availableSlots = [];
    
    timeSlots.forEach(time => {
      const [hour, minute] = time.split(':').map(Number);
      const slotStart = hour * 60 + minute;
      const slotEnd = slotStart + duration;

      // Проверяем, не выходит ли за пределы рабочего дня (до 20:00)
      if (slotEnd > 20 * 60) return;

      // Проверяем пересечения с существующими записями
      const hasConflict = appointments.some(existing => {
        if (existing.date !== date) return false;

        const [existHour, existMinute] = existing.time.split(':').map(Number);
        const existStart = existHour * 60 + existMinute;
        const existEnd = existStart + (existing.duration || 60);

        return (slotStart < existEnd && slotEnd > existStart);
      });

      if (!hasConflict) {
        availableSlots.push(time);
      }
    });

    return availableSlots;
  };

  const addAppointment = async (appointment) => {
  const newAppointment = {
    id: Date.now().toString(),
    ...appointment,
    status: 'scheduled', // По умолчанию "запланирована"
    createdAt: new Date().toISOString(),
    financeRecorded: false
  };
  
  // Проверяем доступность времени (только с неотмененными записями)
  const activeAppointments = appointments.filter(a => a.status !== 'cancelled');
  
  const [startHour, startMinute] = appointment.time.split(':').map(Number);
  const newStart = startHour * 60 + startMinute;
  const newEnd = newStart + appointment.duration;

  const isAvailable = !activeAppointments.some(existing => {
    if (existing.date !== appointment.date) return false;

    const [existHour, existMinute] = existing.time.split(':').map(Number);
    const existStart = existHour * 60 + existMinute;
    const existEnd = existStart + (existing.duration || 60);

    return (newStart < existEnd && newEnd > existStart);
  });

  if (isAvailable) {
    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    await AsyncStorage.setItem('appointments', JSON.stringify(updated));
    return true;
  }
  return false;
};

  // Добавьте эту функцию в AppContext.js после addAppointment

const updateAppointmentStatus = async (appointmentId, newStatus) => {
  const updatedAppointments = appointments.map(app => {
    if (app.id === appointmentId) {
      return { 
        ...app, 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
    }
    return app;
  });
  
  setAppointments(updatedAppointments);
  await AsyncStorage.setItem('appointments', JSON.stringify(updatedAppointments));
  
  // Если статус изменен на "завершена", добавляем запись в финансы (если еще не добавлена)
  if (newStatus === 'completed') {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment && !appointment.financeRecorded) {
      const financeRecord = {
        id: Date.now().toString() + '_finance',
        type: 'income',
        category: 'service',
        amount: appointment.price,
        description: `Услуга: ${appointment.serviceName} - ${appointment.clientName}`,
        date: appointment.date,
        owner: appointment.cosmetologistId === 'common' ? 'common' : appointment.cosmetologistId,
        createdBy: appointment.cosmetologistId,
        createdAt: new Date().toISOString(),
        appointmentId: appointment.id
      };
      
      const updatedFinances = [...finances, financeRecord];
      setFinances(updatedFinances);
      await AsyncStorage.setItem('finances', JSON.stringify(updatedFinances));
      
      // Отмечаем, что финансовая запись создана
      const appointmentsWithFinanceFlag = updatedAppointments.map(app => {
        if (app.id === appointmentId) {
          return { ...app, financeRecorded: true };
        }
        return app;
      });
      setAppointments(appointmentsWithFinanceFlag);
      await AsyncStorage.setItem('appointments', JSON.stringify(appointmentsWithFinanceFlag));
    }
  }
  
  return true;
};

const deleteAppointment = async (appointmentId) => {
  const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
  setAppointments(updatedAppointments);
  await AsyncStorage.setItem('appointments', JSON.stringify(updatedAppointments));
  return true;
};


  // Сервисы (услуги)
  const addService = async (service) => {
    const newService = {
      id: Date.now().toString(),
      ...service,
      createdAt: new Date().toISOString()
    };
    const updated = [...services, newService];
    setServices(updated);
    await AsyncStorage.setItem('services', JSON.stringify(updated));
  };

  const updateService = async (id, updatedService) => {
    const updated = services.map(s => s.id === id ? { ...s, ...updatedService } : s);
    setServices(updated);
    await AsyncStorage.setItem('services', JSON.stringify(updated));
  };

  const deleteService = async (id) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    await AsyncStorage.setItem('services', JSON.stringify(updated));
  };

  const getServicesByUser = (userId) => {
    return services.filter(s => s.cosmetologistId === userId);
  };

  const addMaterial = async (material) => {
    const newMaterial = {
      id: Date.now().toString(),
      ...material,
      createdAt: new Date().toISOString()
    };
    const updated = [...materials, newMaterial];
    setMaterials(updated);
    await AsyncStorage.setItem('materials', JSON.stringify(updated));
  };

  const updateMaterialQuantity = async (id, quantity) => {
    const updated = materials.map(m => 
      m.id === id ? { ...m, quantity } : m
    );
    setMaterials(updated);
    await AsyncStorage.setItem('materials', JSON.stringify(updated));
  };

  const addFinanceRecord = async (record) => {
    const newRecord = {
      id: Date.now().toString(),
      ...record,
      createdAt: new Date().toISOString()
    };
    const updated = [...finances, newRecord];
    setFinances(updated);
    await AsyncStorage.setItem('finances', JSON.stringify(updated));
  };

  const value = {
    currentUser,
    users,
    appointments,
    materials,
    services,
    finances,
    loading,
    login,
    logout,
    addAppointment,
    addMaterial,
    updateMaterialQuantity,
    addService,
    updateService,
    deleteService,
    getServicesByUser,
    addFinanceRecord,
    checkTimeAvailability,
    findAvailableSlots,
    updateAppointmentStatus,
    deleteAppointment
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};