import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { useApp } from '../context/AppContext';

export default function ScheduleScreen() {
  const { currentUser, appointments, addAppointment, getServicesByUser, updateAppointmentStatus, deleteAppointment } = useApp();
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    clientName: '',
    serviceId: '',
    serviceName: '',
    duration: 60,
    price: '',
    time: ''
  });

  const userServices = getServicesByUser(currentUser?.id);
  
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  const getStatusInfo = (status) => {
    switch(status) {
      case 'scheduled':
        return {
          label: 'Запланирована',
          color: '#FF9800',
          bgColor: '#fff3e0',
          icon: 'time-outline'
        };
      case 'confirmed':
        return {
          label: 'Подтверждена',
          color: '#2196F3',
          bgColor: '#e3f2fd',
          icon: 'checkmark-circle-outline'
        };
      case 'completed':
        return {
          label: 'Завершена',
          color: '#4CAF50',
          bgColor: '#e8f5e8',
          icon: 'checkmark-done-circle-outline'
        };
      case 'cancelled':
        return {
          label: 'Отменена',
          color: '#F44336',
          bgColor: '#ffebee',
          icon: 'close-circle-outline'
        };
      default:
        return {
          label: 'Запланирована',
          color: '#FF9800',
          bgColor: '#fff3e0',
          icon: 'time-outline'
        };
    }
  };

  const getAvailableActions = (status) => {
    switch(status) {
      case 'scheduled':
        return ['confirm', 'cancel'];
      case 'confirmed':
        return ['complete', 'cancel'];
      case 'completed':
        return ['delete'];
      case 'cancelled':
        return ['delete'];
      default:
        return [];
    }
  };

  const getActionButton = (action) => {
    switch(action) {
      case 'confirm':
        return {
          label: 'Подтвердить',
          icon: 'checkmark-circle-outline',
          color: '#2196F3',
          nextStatus: 'confirmed'
        };
      case 'cancel':
        return {
          label: 'Отменить',
          icon: 'close-circle-outline',
          color: '#F44336',
          nextStatus: 'cancelled'
        };
      case 'complete':
        return {
          label: 'Завершить',
          icon: 'checkmark-done-circle-outline',
          color: '#4CAF50',
          nextStatus: 'completed'
        };
      case 'delete':
        return {
          label: 'Удалить',
          icon: 'trash-outline',
          color: '#F44336',
          nextStatus: 'delete'
        };
      default:
        return null;
    }
  };

  const handleAppointmentAction = async (action, appointment) => {
    const actionConfig = getActionButton(action);
    
    if (action === 'delete') {
      Alert.alert(
        'Удаление записи',
        'Вы уверены, что хотите удалить эту запись?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              await deleteAppointment(appointment.id);
              setActionModalVisible(false);
              setSelectedAppointment(null);
              Alert.alert('Успех', 'Запись удалена');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        `${actionConfig.label} запись`,
        `Вы уверены, что хотите ${actionConfig.label.toLowerCase()} эту запись?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: actionConfig.label,
            onPress: async () => {
              await updateAppointmentStatus(appointment.id, actionConfig.nextStatus);
              setActionModalVisible(false);
              setSelectedAppointment(null);
              Alert.alert('Успех', `Запись ${actionConfig.label.toLowerCase()}`);
            }
          }
        ]
      );
    }
  };

  const getMarkedDates = () => {
    const marked = {};
    appointments.forEach(app => {
      if (!marked[app.date]) {
        marked[app.date] = { 
          marked: true,
          dotColor: getStatusInfo(app.status).color
        };
      }
    });
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#9C27B0'
      };
    }
    return marked;
  };

  const getAppointmentsForDate = () => {
    return appointments.filter(app => 
      app.date === selectedDate && 
      app.cosmetologistId === currentUser?.id
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Функция для определения цвета слота
  const getTimeSlotColor = (time) => {
    if (!selectedDate) return 'available';
    
    const [checkHour, checkMinute] = time.split(':').map(Number);
    const checkStart = checkHour * 60 + checkMinute;
    
    // Получаем все записи на эту дату (только неотмененные)
    const activeAppointments = appointments.filter(app => 
      app.date === selectedDate && app.status !== 'cancelled'
    );
    
    // Проверяем пересечение с существующими записями (для определения занятости)
    const overlappingAppointments = activeAppointments.filter(app => {
      const [existHour, existMinute] = app.time.split(':').map(Number);
      const existStart = existHour * 60 + existMinute;
      const existEnd = existStart + (app.duration || 60);
      
      // Проверяем пересечение (используем 1 час как базовый интервал для проверки занятости)
      return (checkStart < existEnd && checkStart + 60 > existStart);
    });

    // Если есть пересекающиеся записи - показываем занятость
    if (overlappingAppointments.length > 0) {
      const hasCurrentUserAppointment = overlappingAppointments.some(
        app => app.cosmetologistId === currentUser?.id
      );
      return hasCurrentUserAppointment ? 'busy_self' : 'busy_other';
    }

    // Если услуга не выбрана - все свободные слоты доступны
    if (!newAppointment.serviceId) {
      return 'available';
    }

    // Если услуга выбрана - проверяем, помещается ли процедура по длительности
    const duration = newAppointment.duration;
    const checkEnd = checkStart + duration;

    // Проверка 1: Не выходит ли за пределы рабочего дня (9:00 - 20:30)
    if (checkStart < 9 * 60 || checkEnd > 20.5 * 60) {
      return 'not_enough_time';
    }

    // Если нет других записей в этот день - слот доступен
    if (activeAppointments.length === 0) {
      return 'available';
    }

    // Сортируем записи по времени
    const sortedAppointments = [...activeAppointments].sort((a, b) => {
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);
      return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
    });

    // Проверяем слот до первой записи
    const firstApp = sortedAppointments[0];
    const [firstHour, firstMinute] = firstApp.time.split(':').map(Number);
    const firstStart = firstHour * 60 + firstMinute;
    
    if (checkEnd <= firstStart) {
      return 'available';
    }

    // Проверяем слоты между записями
    for (let i = 0; i < sortedAppointments.length - 1; i++) {
      const currentApp = sortedAppointments[i];
      const nextApp = sortedAppointments[i + 1];
      
      const [currHour, currMinute] = currentApp.time.split(':').map(Number);
      const currStart = currHour * 60 + currMinute;
      const currEnd = currStart + (currentApp.duration || 60);
      
      const [nextHour, nextMinute] = nextApp.time.split(':').map(Number);
      const nextStart = nextHour * 60 + nextMinute;
      
      // Если наш слот начинается после текущей записи и заканчивается до следующей
      if (checkStart >= currEnd && checkEnd <= nextStart) {
        return 'available';
      }
    }

    // Проверяем слот после последней записи
    const lastApp = sortedAppointments[sortedAppointments.length - 1];
    const [lastHour, lastMinute] = lastApp.time.split(':').map(Number);
    const lastEnd = lastHour * 60 + lastMinute + (lastApp.duration || 60);
    
    if (checkStart >= lastEnd && checkEnd <= 20.5 * 60) {
      return 'available';
    }

    // Если ни одно условие не подошло - слот не подходит по длительности
    return 'not_enough_time';
  };

  const handleServiceSelect = (serviceId) => {
    const service = userServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setNewAppointment({
        ...newAppointment,
        serviceId: service.id,
        serviceName: service.name,
        duration: service.duration,
        price: service.price.toString()
      });
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedDate) {
      Alert.alert('Ошибка', 'Выберите дату');
      return;
    }

    if (!newAppointment.clientName) {
      Alert.alert('Ошибка', 'Введите имя клиента');
      return;
    }

    if (!newAppointment.serviceId) {
      Alert.alert('Ошибка', 'Выберите услугу');
      return;
    }

    if (!newAppointment.time) {
      Alert.alert('Ошибка', 'Выберите время');
      return;
    }

    const appointment = {
      ...newAppointment,
      date: selectedDate,
      cosmetologistId: currentUser.id,
      cosmetologistName: currentUser.name,
      status: 'scheduled',
      price: parseFloat(newAppointment.price)
    };

    const success = await addAppointment(appointment);
    if (success) {
      setModalVisible(false);
      setSelectedService(null);
      setNewAppointment({
        clientName: '',
        serviceId: '',
        serviceName: '',
        duration: 60,
        price: '',
        time: ''
      });
      Alert.alert('Успех', 'Запись добавлена');
    } else {
      Alert.alert('Ошибка', 'Это время уже занято');
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  const renderAppointmentItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.appointmentCard}
        onPress={() => {
          setSelectedAppointment(item);
          setActionModalVisible(true);
        }}
      >
        <View style={styles.appointmentTimeContainer}>
          <Text style={styles.appointmentTime}>{item.time}</Text>
          <Text style={styles.appointmentDuration}>{formatDuration(item.duration)}</Text>
        </View>
        
        <View style={styles.appointmentInfo}>
          <View style={styles.appointmentHeader}>
            <Ionicons name="person" size={16} color="#9C27B0" />
            <Text style={styles.clientName}>{item.clientName}</Text>
          </View>
          <View style={styles.appointmentService}>
            <Ionicons name="cut" size={14} color="#666" />
            <Text style={styles.serviceName}>{item.serviceName}</Text>
          </View>
          <Text style={styles.appointmentPrice}>{item.price} ₽</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const serviceItems = userServices.map(service => ({
    label: `${service.name} (${formatDuration(service.duration)} - ${service.price}₽)`,
    value: service.id
  }));

  const getAvailableSlotsCount = () => {
    if (!selectedDate || !newAppointment.serviceId) return 0;
    
    let available = 0;
    timeSlots.forEach(time => {
      const status = getTimeSlotColor(time);
      if (status === 'available') available++;
    });
    
    return available;
  };

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={getMarkedDates()}
        theme={{
          selectedDayBackgroundColor: '#9C27B0',
          todayTextColor: '#9C27B0',
          arrowColor: '#9C27B0',
          monthTextColor: '#333',
          textMonthFontWeight: 'bold',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
      />

      {selectedDate ? (
        <View style={styles.appointmentsContainer}>
          <View style={styles.appointmentsHeader}>
            <View>
              <Text style={styles.dateTitle}>
                {new Date(selectedDate).toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </Text>
              <Text style={styles.appointmentsCount}>
                {getAppointmentsForDate().length} записей
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={getAppointmentsForDate()}
            renderItem={renderAppointmentItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>Нет записей на этот день</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.emptyButtonText}>Добавить запись</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      ) : (
        <View style={styles.noDateContainer}>
          <Ionicons name="calendar" size={60} color="#e0e0e0" />
          <Text style={styles.noDateText}>Выберите дату для просмотра записей</Text>
        </View>
      )}

      {/* Модальное окно создания записи */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedService(null);
          setNewAppointment({
            clientName: '',
            serviceId: '',
            serviceName: '',
            duration: 60,
            price: '',
            time: ''
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новая запись</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setSelectedService(null);
                setNewAppointment({
                  clientName: '',
                  serviceId: '',
                  serviceName: '',
                  duration: 60,
                  price: '',
                  time: ''
                });
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDate}>
                {new Date(selectedDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Имя клиента *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите имя клиента"
                  value={newAppointment.clientName}
                  onChangeText={(text) => setNewAppointment({...newAppointment, clientName: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Услуга *</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={handleServiceSelect}
                    items={serviceItems}
                    placeholder={{ label: 'Выберите услугу...', value: null }}
                    value={newAppointment.serviceId}
                    style={{
                      inputIOS: styles.pickerInput,
                      inputAndroid: styles.pickerInput,
                      placeholder: { color: '#999' }
                    }}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                  />
                </View>
              </View>

              {selectedService && (
                <View style={styles.servicePreview}>
                  <View style={styles.servicePreviewRow}>
                    <Ionicons name="time-outline" size={16} color="#9C27B0" />
                    <Text style={styles.servicePreviewText}>
                      Длительность: {formatDuration(selectedService.duration)}
                    </Text>
                  </View>
                  <View style={styles.servicePreviewRow}>
                    <Ionicons name="cash-outline" size={16} color="#9C27B0" />
                    <Text style={styles.servicePreviewText}>
                      Стоимость: {selectedService.price} ₽
                    </Text>
                  </View>
                  {selectedService.description && (
                    <View style={styles.servicePreviewRow}>
                      <Ionicons name="information-circle-outline" size={16} color="#9C27B0" />
                      <Text style={styles.servicePreviewText}>
                        {selectedService.description}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.servicePreviewRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 8 }]}>
                    <Ionicons name="calendar-outline" size={16} color="#9C27B0" />
                    <Text style={[styles.servicePreviewText, { fontWeight: 'bold' }]}>
                      Доступно слотов: {getAvailableSlotsCount()}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Время *
                  {selectedService && ' (цвета показывают доступность)'}
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeSlotsScrollContent}
                >
                  <View style={styles.timeSlotsRow}>
                    {timeSlots.map((time) => {
                      const status = getTimeSlotColor(time);
                      const isSelected = newAppointment.time === time;
                      
                      let slotStyle = styles.timeSlot;
                      let textStyle = styles.timeSlotText;
                      let statusText = '';
                      let disabled = false;
                      
                      switch(status) {
                        case 'available':
                          slotStyle = [styles.timeSlot, styles.availableSlot];
                          textStyle = [styles.timeSlotText];
                          disabled = false;
                          break;
                        case 'busy_self':
                          slotStyle = [styles.timeSlot, styles.busySelfSlot];
                          textStyle = [styles.timeSlotText, styles.busySelfText];
                          statusText = 'моё';
                          disabled = true;
                          break;
                        case 'busy_other':
                          slotStyle = [styles.timeSlot, styles.busyOtherSlot];
                          textStyle = [styles.timeSlotText, styles.busyOtherText];
                          statusText = 'другой';
                          disabled = true;
                          break;
                        case 'not_enough_time':
                          slotStyle = [styles.timeSlot, styles.notEnoughTimeSlot];
                          textStyle = [styles.timeSlotText, styles.notEnoughTimeText];
                          statusText = 'не влезает';
                          disabled = true;
                          break;
                      }
                      
                      if (isSelected && status === 'available') {
                        slotStyle = [styles.timeSlot, styles.selectedTimeSlot];
                        textStyle = [styles.timeSlotText, styles.selectedTimeSlotText];
                        statusText = '';
                      }
                      
                      return (
                        <TouchableOpacity
                          key={time}
                          style={slotStyle}
                          onPress={() => !disabled && setNewAppointment({...newAppointment, time})}
                          disabled={disabled}
                        >
                          <Text style={textStyle}>{time}</Text>
                          {statusText ? (
                            <Text style={[
                              styles.bookedText,
                              status === 'busy_self' ? styles.bookedSelfText :
                              status === 'busy_other' ? styles.bookedOtherText :
                              styles.notEnoughTimeText
                            ]}>{statusText}</Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Условные обозначения:</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, styles.availableDot]} />
                  <Text style={styles.legendText}>Свободно</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, styles.busySelfDot]} />
                  <Text style={styles.legendText}>Занято мной</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, styles.busyOtherDot]} />
                  <Text style={styles.legendText}>Занято другим мастером</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, styles.notEnoughDot]} />
                  <Text style={styles.legendText}>Не подходит по длительности</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedService(null);
                  setNewAppointment({
                    clientName: '',
                    serviceId: '',
                    serviceName: '',
                    duration: 60,
                    price: '',
                    time: ''
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddAppointment}
              >
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модальное окно действий с записью */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => {
          setActionModalVisible(false);
          setSelectedAppointment(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>Управление записью</Text>
              <TouchableOpacity onPress={() => {
                setActionModalVisible(false);
                setSelectedAppointment(null);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedAppointment && (
              <>
                <View style={styles.appointmentSummary}>
                  <View style={styles.summaryRow}>
                    <Ionicons name="person" size={16} color="#9C27B0" />
                    <Text style={styles.summaryText}>{selectedAppointment.clientName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="cut" size={16} color="#9C27B0" />
                    <Text style={styles.summaryText}>{selectedAppointment.serviceName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="calendar" size={16} color="#9C27B0" />
                    <Text style={styles.summaryText}>
                      {new Date(selectedAppointment.date).toLocaleDateString('ru-RU')} в {selectedAppointment.time}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="time" size={16} color="#9C27B0" />
                    <Text style={styles.summaryText}>{formatDuration(selectedAppointment.duration)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="cash" size={16} color="#9C27B0" />
                    <Text style={styles.summaryText}>{selectedAppointment.price} ₽</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.statusRow]}>
                    <Ionicons name="information-circle" size={16} color={getStatusInfo(selectedAppointment.status).color} />
                    <Text style={[styles.statusLabel, { color: getStatusInfo(selectedAppointment.status).color }]}>
                      Статус: {getStatusInfo(selectedAppointment.status).label}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsContainer}>
                  {getAvailableActions(selectedAppointment.status).map(action => {
                    const actionConfig = getActionButton(action);
                    return (
                      <TouchableOpacity
                        key={action}
                        style={[styles.actionButton, { backgroundColor: actionConfig.color }]}
                        onPress={() => handleAppointmentAction(action, selectedAppointment)}
                      >
                        <Ionicons name={actionConfig.icon} size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>{actionConfig.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TouchableOpacity 
              style={styles.closeActionButton}
              onPress={() => {
                setActionModalVisible(false);
                setSelectedAppointment(null);
              }}
            >
              <Text style={styles.closeActionButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  calendar: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  appointmentsContainer: {
    flex: 1,
    padding: 15
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  appointmentsCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  addButton: {
    backgroundColor: '#9C27B0',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  listContent: {
    paddingBottom: 20
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  appointmentTimeContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    marginRight: 15
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  appointmentDuration: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center'
  },
  appointmentInfo: {
    flex: 1
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6
  },
  appointmentService: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1
  },
  appointmentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  statusContainer: {
    justifyContent: 'center',
    marginLeft: 10
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20
  },
  emptyButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  noDateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  noDateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalDate: {
    fontSize: 16,
    color: '#9C27B0',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden'
  },
  pickerInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#333'
  },
  servicePreview: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  servicePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  servicePreviewText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  timeSlotsScrollContent: {
    paddingVertical: 5
  },
  timeSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timeSlot: {
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  availableSlot: {
    backgroundColor: '#e8f5e8',
    borderColor: '#a5d6a7'
  },
  busySelfSlot: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffb74d'
  },
  busyOtherSlot: {
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a'
  },
  notEnoughTimeSlot: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9'
  },
  selectedTimeSlot: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: '600'
  },
  busySelfText: {
    color: '#f57c00'
  },
  busyOtherText: {
    color: '#d32f2f'
  },
  notEnoughTimeText: {
    color: '#1976d2'
  },
  bookedText: {
    fontSize: 8,
    marginTop: 2,
    fontWeight: '500'
  },
  bookedSelfText: {
    color: '#f57c00'
  },
  bookedOtherText: {
    color: '#d32f2f'
  },
  legendContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  availableDot: {
    backgroundColor: '#e8f5e8'
  },
  busySelfDot: {
    backgroundColor: '#fff3e0'
  },
  busyOtherDot: {
    backgroundColor: '#ffebee'
  },
  notEnoughDot: {
    backgroundColor: '#e3f2fd'
  },
  legendText: {
    fontSize: 12,
    color: '#666'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  saveButton: {
    backgroundColor: '#9C27B0',
    marginLeft: 8
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  appointmentSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  statusRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  closeActionButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  closeActionButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  }
});