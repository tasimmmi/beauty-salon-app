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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';

export default function ClientsScreen() {
  const { currentUser, clients, addClient, addClientVisit } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [newVisit, setNewVisit] = useState({
    date: new Date().toISOString().split('T')[0],
    service: '',
    price: '',
    notes: ''
  });

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone) {
      Alert.alert('Ошибка', 'Заполните имя и телефон');
      return;
    }

    await addClient({
      ...newClient,
      cosmetologistId: currentUser.id
    });

    setModalVisible(false);
    setNewClient({
      name: '',
      phone: '',
      email: '',
      notes: ''
    });
    Alert.alert('Успех', 'Клиент добавлен');
  };

  const handleAddVisit = async () => {
    if (!newVisit.service || !newVisit.price) {
      Alert.alert('Ошибка', 'Заполните услугу и стоимость');
      return;
    }

    await addClientVisit(selectedClient.id, {
      ...newVisit,
      price: parseFloat(newVisit.price),
      cosmetologistId: currentUser.id
    });

    setVisitModalVisible(false);
    setNewVisit({
      date: new Date().toISOString().split('T')[0],
      service: '',
      price: '',
      notes: ''
    });
    Alert.alert('Успех', 'Визит добавлен');
  };

  const renderClientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => setSelectedClient(item)}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientPhone}>{item.phone}</Text>
        </View>
      </View>
      
      <View style={styles.clientStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Визитов</Text>
          <Text style={styles.statValue}>{item.visits?.length || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Всего</Text>
          <Text style={styles.statValue}>
            {item.visits?.reduce((sum, v) => sum + v.price, 0) || 0} ₽
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVisitItem = ({ item }) => (
    <View style={styles.visitItem}>
      <View style={styles.visitHeader}>
        <Text style={styles.visitDate}>
          {new Date(item.date).toLocaleDateString('ru-RU')}
        </Text>
        <Text style={styles.visitPrice}>{item.price} ₽</Text>
      </View>
      <Text style={styles.visitService}>{item.service}</Text>
      {item.notes ? <Text style={styles.visitNotes}>{item.notes}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Клиенты</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients.filter(c => c.cosmetologistId === currentUser.id)}
        renderItem={renderClientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Нет клиентов</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новый клиент</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Имя *"
              value={newClient.name}
              onChangeText={(text) => setNewClient({...newClient, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Телефон *"
              value={newClient.phone}
              onChangeText={(text) => setNewClient({...newClient, phone: text})}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newClient.email}
              onChangeText={(text) => setNewClient({...newClient, email: text})}
              keyboardType="email-address"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Заметки"
              value={newClient.notes}
              onChangeText={(text) => setNewClient({...newClient, notes: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddClient}
              >
                <Text style={styles.saveButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedClient && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedClient}
          onRequestClose={() => setSelectedClient(null)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.clientDetailsModal]}>
              <View style={styles.clientDetailsHeader}>
                <View style={styles.clientDetailsAvatar}>
                  <Text style={styles.clientDetailsAvatarText}>
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientDetailsInfo}>
                  <Text style={styles.clientDetailsName}>{selectedClient.name}</Text>
                  <Text style={styles.clientDetailsPhone}>{selectedClient.phone}</Text>
                  {selectedClient.email ? (
                    <Text style={styles.clientDetailsEmail}>{selectedClient.email}</Text>
                  ) : null}
                </View>
              </View>

              {selectedClient.notes ? (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Заметки:</Text>
                  <Text style={styles.notesText}>{selectedClient.notes}</Text>
                </View>
              ) : null}

              <View style={styles.visitsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>История посещений</Text>
                  <TouchableOpacity 
                    style={styles.addVisitButton}
                    onPress={() => setVisitModalVisible(true)}
                  >
                    <Icon name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={selectedClient.visits}
                  renderItem={renderVisitItem}
                  keyExtractor={(item, index) => index.toString()}
                  ListEmptyComponent={
                    <Text style={styles.noVisitsText}>Нет посещений</Text>
                  }
                />
              </View>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedClient(null)}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={visitModalVisible}
        onRequestClose={() => setVisitModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Новый визит</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Дата (ГГГГ-ММ-ДД)"
              value={newVisit.date}
              onChangeText={(text) => setNewVisit({...newVisit, date: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Услуга"
              value={newVisit.service}
              onChangeText={(text) => setNewVisit({...newVisit, service: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Стоимость (₽)"
              value={newVisit.price}
              onChangeText={(text) => setNewVisit({...newVisit, price: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Заметки"
              value={newVisit.notes}
              onChangeText={(text) => setNewVisit({...newVisit, notes: text})}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setVisitModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddVisit}
              >
                <Text style={styles.saveButtonText}>Добавить</Text>
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
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
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
    padding: 15
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  clientInfo: {
    flex: 1
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  clientPhone: {
    fontSize: 14,
    color: '#666'
  },
  clientStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15
  },
  stat: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0'
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5
  },
  clientDetailsModal: {
    maxHeight: '90%'
  },
  modalTitle: {
    fontSize: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top'
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
  clientDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  clientDetailsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  clientDetailsAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  clientDetailsInfo: {
    flex: 1
  },
  clientDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  clientDetailsPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  clientDetailsEmail: {
    fontSize: 14,
    color: '#666'
  },
  notesSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  notesText: {
    fontSize: 14,
    color: '#666'
  },
  visitsSection: {
    flex: 1,
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  addVisitButton: {
    backgroundColor: '#9C27B0',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  visitItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  visitPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  visitService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  visitNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic'
  },
  noVisitsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    padding: 20
  },
  closeButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});