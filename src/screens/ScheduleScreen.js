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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';

export default function ScheduleScreen() {
  const { currentUser, appointments, addAppointment, clients, users } = useApp();
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    clientId: '',
    clientName: '',
    service: '',
    time: '',
    duration: 60,
    price: ''
  });

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const getMarkedDates = () => {
    const marked = {};
    appointments.forEach(app => {
      const date = app.date;
      if (!marked[date]) {
        marked[date] = { marked: true };
      }
    });
    return marked;
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(app => 
      app.date === date && 
      app.cosmetologistId === currentUser?.id
    );
  };

  const handleAddAppointment = async () => {
    if (!selectedDate || !newAppointment.clientName || !newAppointment.service || 
        !newAppointment.time || !newAppointment.price) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    const appointment = {
      ...newAppointment,
      date: selectedDate,
      cosmetologistId: currentUser.id,
      cosmetologistName: currentUser.name,
      status: 'scheduled'
    };

    const success = await addAppointment(appointment);
    if (success) {
      setModalVisible(false);
      setNewAppointment({
        clientId: '',
        clientName: '',
        service: '',
        time: '',
        duration: 60,
        price: ''
      });
      Alert.alert('Успех', 'Запись добавлена');
    } else {
      Alert.alert('Ошибка', 'Это время уже занято');
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => setSelectedAppointment(item)}
    >
      <View style={styles.appointmentTime}>
        <Text style={styles.timeText}>{item.time}</Text>
        <Text style={styles.durationText}>{item.duration} мин</Text>
      </View>
      <View style={styles.appointmentInfo}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.serviceName}>{item.service}</Text>
        <Text style={styles.price}>{item.price} ₽</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{item.status === 'scheduled' ? 'Запланировано' : 'Завершено'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...getMarkedDates(),
          [selectedDate]: { selected: true, selectedColor: '#9C27B0' }
        }}
        theme={{
          selectedDayBackgroundColor: '#9C27B0',
          todayTextColor: '#9C27B0',
          arrowColor: '#9C27B0'
        }}
      />

      {selectedDate && (
        <View style={styles.appointmentsContainer}>
          <View style={styles.header}>
            <Text style={styles.dateTitle}>
              Записи на {new Date(selectedDate).toLocaleDateString('ru-RU')}
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={getAppointmentsForDate(selectedDate)}
            renderItem={renderAppointmentItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="event-busy" size={50} color="#ccc" />
                <Text style={styles.emptyText}>Нет записей на этот день</Text>
              </View>
            }
          />
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новая запись</Text>
            
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Имя клиента"
                value={newAppointment.clientName}
                onChangeText={(text) => setNewAppointment({...newAppointment, clientName: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Услуга"
                value={newAppointment.service}
                onChangeText={(text) => setNewAppointment({...newAppointment, service: text})}
              />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Время:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        newAppointment.time === time && styles.selectedTimeSlot
                      ]}
                      onPress={() => setNewAppointment({...newAppointment, time})}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        newAppointment.time === time && styles.selectedTimeSlotText
                      ]}>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Стоимость (₽)"
                value={newAppointment.price}
                onChangeText={(text) => setNewAppointment({...newAppointment, price: text})}
                keyboardType="numeric"
              />
              
              <View style={styles.durationContainer}>
                <Text style={styles.label}>Длительность (мин):</Text>
                <View style={styles.durationButtons}>
                  {[30, 60, 90, 120].map((duration) => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationButton,
                        newAppointment.duration === duration && styles.selectedDuration
                      ]}
                      onPress={() => setNewAppointment({...newAppointment, duration})}
                    >
                      <Text style={[
                        styles.durationButtonText,
                        newAppointment.duration === duration && styles.selectedDurationText
                      ]}>{duration}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
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

      {selectedAppointment && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedAppointment}
          onRequestClose={() => setSelectedAppointment(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Детали записи</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Клиент:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.clientName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Услуга:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.service}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Дата:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedAppointment.date).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Время:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.time}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Длительность:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.duration} мин</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Стоимость:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.price} ₽</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setSelectedAppointment(null)}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  calendar: {
    marginBottom: 10
  },
  appointmentsContainer: {
    flex: 1,
    padding: 15
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#9C27B0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    paddingBottom: 20
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  appointmentTime: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    marginRight: 15
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5
  },
  appointmentInfo: {
    flex: 1
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    color: '#666'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16
  },
  pickerContainer: {
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  timeSlot: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedTimeSlot: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666'
  },
  selectedTimeSlotText: {
    color: '#fff'
  },
  durationContainer: {
    marginBottom: 20
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedDuration: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  durationButtonText: {
    fontSize: 14,
    color: '#666'
  },
  selectedDurationText: {
    color: '#fff'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  saveButton: {
    backgroundColor: '#9C27B0',
    marginLeft: 10
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
  closeButton: {
    backgroundColor: '#9C27B0',
    marginTop: 20
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    width: 100,
    fontSize: 16,
    color: '#666'
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  }
});