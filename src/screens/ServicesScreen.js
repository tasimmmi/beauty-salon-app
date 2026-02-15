import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function ServicesScreen() {
  const { currentUser, services, addService, updateService, deleteService, getServicesByUser } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    duration: '60',
    price: '',
    description: '',
    cosmetologistId: currentUser?.id || ''
  });

  const userServices = getServicesByUser(currentUser?.id);

  const handleSaveService = async () => {
    if (!newService.name || !newService.duration || !newService.price) {
      Alert.alert('Ошибка', 'Заполните название, длительность и цену');
      return;
    }

    const serviceData = {
      ...newService,
      duration: parseInt(newService.duration),
      price: parseFloat(newService.price),
      cosmetologistId: currentUser.id
    };

    if (editingService) {
      await updateService(editingService.id, serviceData);
      Alert.alert('Успех', 'Услуга обновлена');
    } else {
      await addService(serviceData);
      Alert.alert('Успех', 'Услуга добавлена');
    }

    setModalVisible(false);
    setEditingService(null);
    setNewService({
      name: '',
      duration: '60',
      price: '',
      description: '',
      cosmetologistId: currentUser?.id || ''
    });
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      description: service.description || '',
      cosmetologistId: service.cosmetologistId
    });
    setModalVisible(true);
  };

  const handleDeleteService = (serviceId) => {
    Alert.alert(
      'Удаление услуги',
      'Вы уверены, что хотите удалить эту услугу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await deleteService(serviceId);
            Alert.alert('Успех', 'Услуга удалена');
          }
        }
      ]
    );
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIcon}>
          <Ionicons name="cut" size={24} color="#fff" />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetail}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.serviceDetailText}>{formatDuration(item.duration)}</Text>
            </View>
            <View style={styles.serviceDetail}>
              <Ionicons name="cash-outline" size={14} color="#666" />
              <Text style={styles.serviceDetailText}>{item.price} BYN</Text>
            </View>
          </View>
        </View>
      </View>
      
      {item.description ? (
        <Text style={styles.serviceDescription}>{item.description}</Text>
      ) : null}
      
      <View style={styles.serviceActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditService(item)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Изменить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteService(item.id)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Мои услуги</Text>
          <Text style={styles.subtitle}>{userServices.length} услуг</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditingService(null);
            setNewService({
              name: '',
              duration: '60',
              price: '',
              description: '',
              cosmetologistId: currentUser?.id || ''
            });
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={userServices}
        renderItem={renderServiceItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cut-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Нет услуг</Text>
            <Text style={styles.emptyText}>
              Добавьте свои услуги, чтобы использовать их при создании записей
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => {
                setEditingService(null);
                setNewService({
                  name: '',
                  duration: '60',
                  price: '',
                  description: '',
                  cosmetologistId: currentUser?.id || ''
                });
                setModalVisible(true);
              }}
            >
              <Text style={styles.emptyButtonText}>Добавить услугу</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingService(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Редактировать услугу' : 'Новая услуга'}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setEditingService(null);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Название услуги *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: Чистка лица"
                  value={newService.name}
                  onChangeText={(text) => setNewService({...newService, name: text})}
                />
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Длительность *</Text>
                  <View style={styles.durationInput}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="60"
                      value={newService.duration}
                      onChangeText={(text) => setNewService({...newService, duration: text})}
                      keyboardType="numeric"
                    />
                    <Text style={styles.durationHint}>мин</Text>
                  </View>
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Цена *</Text>
                  <View style={styles.priceInput}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="1500"
                      value={newService.price}
                      onChangeText={(text) => setNewService({...newService, price: text})}
                      keyboardType="numeric"
                    />
                    <Text style={styles.priceHint}>₽</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Описание (необязательно)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Краткое описание услуги"
                  value={newService.description}
                  onChangeText={(text) => setNewService({...newService, description: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.durationExamples}>
                <Text style={styles.examplesTitle}>Примеры длительности:</Text>
                <View style={styles.examplesRow}>
                  <TouchableOpacity 
                    style={styles.exampleChip}
                    onPress={() => setNewService({...newService, duration: '30'})}
                  >
                    <Text style={styles.exampleChipText}>30 мин</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.exampleChip}
                    onPress={() => setNewService({...newService, duration: '60'})}
                  >
                    <Text style={styles.exampleChipText}>1 час</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.exampleChip}
                    onPress={() => setNewService({...newService, duration: '90'})}
                  >
                    <Text style={styles.exampleChipText}>1.5 часа</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.exampleChip}
                    onPress={() => setNewService({...newService, duration: '120'})}
                  >
                    <Text style={styles.exampleChipText}>2 часа</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingService(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveService}
              >
                <Text style={styles.saveButtonText}>
                  {editingService ? 'Сохранить' : 'Добавить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  subtitle: {
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
    padding: 15
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: 12
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  serviceDetails: {
    flexDirection: 'row'
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    fontStyle: 'italic'
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8
  },
  editButton: {
    backgroundColor: '#2196F3'
  },
  deleteButton: {
    backgroundColor: '#f44336'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20
  },
  emptyButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
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
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  durationHint: {
    position: 'absolute',
    right: 12,
    fontSize: 16,
    color: '#999'
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priceHint: {
    position: 'absolute',
    right: 12,
    fontSize: 16,
    color: '#999'
  },
  durationExamples: {
    marginTop: 8,
    marginBottom: 20
  },
  examplesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  exampleChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  exampleChipText: {
    fontSize: 14,
    color: '#666'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
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
  }
});