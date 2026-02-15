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

export default function MaterialsScreen() {
  const { currentUser, materials, addMaterial, updateMaterialQuantity } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'common',
    quantity: 0,
    unit: 'шт',
    price: '',
    owner: 'common'
  });
  const [purchase, setPurchase] = useState({
    quantity: 0,
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { id: 'common', name: 'Общие', icon: 'group' },
    { id: 'anna', name: 'Анна', icon: 'person' },
    { id: 'maria', name: 'Мария', icon: 'person' }
  ];

  const getFilteredMaterials = () => {
    return materials.filter(m => 
      m.owner === 'common' || m.owner === currentUser?.id || m.owner === currentUser?.name
    );
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.price) {
      Alert.alert('Ошибка', 'Заполните название и цену');
      return;
    }

    await addMaterial({
      ...newMaterial,
      price: parseFloat(newMaterial.price),
      owner: newMaterial.category === 'common' ? 'common' : currentUser.id
    });

    setModalVisible(false);
    setNewMaterial({
      name: '',
      category: 'common',
      quantity: 0,
      unit: 'шт',
      price: '',
      owner: 'common'
    });
    Alert.alert('Успех', 'Материал добавлен');
  };

  const handlePurchase = async () => {
    if (!purchase.quantity || !purchase.price) {
      Alert.alert('Ошибка', 'Заполните количество и цену');
      return;
    }

    const newQuantity = selectedMaterial.quantity + parseInt(purchase.quantity);
    await updateMaterialQuantity(selectedMaterial.id, newQuantity);

    await addMaterial({
      name: selectedMaterial.name,
      category: selectedMaterial.category,
      quantity: parseInt(purchase.quantity),
      unit: selectedMaterial.unit,
      price: parseFloat(purchase.price),
      owner: selectedMaterial.owner,
      isPurchase: true,
      purchaseDate: purchase.date
    });

    setPurchaseModalVisible(false);
    setPurchase({ quantity: 0, price: '', date: new Date().toISOString().split('T')[0] });
    Alert.alert('Успех', 'Закупка добавлена');
  };

  const renderMaterialItem = ({ item }) => (
    <View style={styles.materialCard}>
      <View style={styles.materialHeader}>
        <Icon 
          name={item.owner === 'common' ? 'group' : 'person'} 
          size={24} 
          color={item.owner === 'common' ? '#9C27B0' : '#2196F3'} 
        />
        <Text style={styles.materialName}>{item.name}</Text>
        <Text style={styles.materialQuantity}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      
      <View style={styles.materialFooter}>
        <Text style={styles.materialPrice}>Цена: {item.price} ₽</Text>
        <View style={styles.materialActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setSelectedMaterial(item);
              setPurchaseModalVisible(true);
            }}
          >
            <Icon name="shopping-cart" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Alert.alert('Расход', 'Введите количество:', [
                {
                  text: 'Отмена',
                  style: 'cancel'
                },
                {
                  text: 'OK',
                  onPress: async (quantity) => {
                    if (quantity && parseInt(quantity) <= item.quantity) {
                      await updateMaterialQuantity(item.id, item.quantity - parseInt(quantity));
                    }
                  }
                }
              ], 'plain-text');
            }}
          >
            <Icon name="remove-circle" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.isPurchase && (
        <View style={styles.purchaseBadge}>
          <Text style={styles.purchaseBadgeText}>Закупка</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Материалы и расходники</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.categories}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              style={[
                styles.categoryChip,
                newMaterial.category === cat.id && styles.selectedCategory
              ]}
              onPress={() => setNewMaterial({...newMaterial, category: cat.id})}
            >
              <Icon 
                name={cat.icon} 
                size={18} 
                color={newMaterial.category === cat.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.categoryText,
                newMaterial.category === cat.id && styles.selectedCategoryText
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={getFilteredMaterials()}
        renderItem={renderMaterialItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Нет материалов</Text>
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
            <Text style={styles.modalTitle}>Добавить материал</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Название материала"
              value={newMaterial.name}
              onChangeText={(text) => setNewMaterial({...newMaterial, name: text})}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Количество"
                value={newMaterial.quantity.toString()}
                onChangeText={(text) => setNewMaterial({...newMaterial, quantity: parseInt(text) || 0})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Ед. изм."
                value={newMaterial.unit}
                onChangeText={(text) => setNewMaterial({...newMaterial, unit: text})}
              />
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Цена за единицу (₽)"
              value={newMaterial.price}
              onChangeText={(text) => setNewMaterial({...newMaterial, price: text})}
              keyboardType="numeric"
            />
            
            <View style={styles.ownerSelector}>
              <Text style={styles.label}>Владелец:</Text>
              <View style={styles.ownerButtons}>
                <TouchableOpacity
                  style={[
                    styles.ownerButton,
                    newMaterial.category === 'common' && styles.selectedOwner
                  ]}
                  onPress={() => setNewMaterial({...newMaterial, category: 'common'})}
                >
                  <Text style={[
                    styles.ownerButtonText,
                    newMaterial.category === 'common' && styles.selectedOwnerText
                  ]}>Общий</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.ownerButton,
                    newMaterial.category === currentUser?.id && styles.selectedOwner
                  ]}
                  onPress={() => setNewMaterial({...newMaterial, category: currentUser.id})}
                >
                  <Text style={[
                    styles.ownerButtonText,
                    newMaterial.category === currentUser?.id && styles.selectedOwnerText
                  ]}>Личный</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddMaterial}
              >
                <Text style={styles.saveButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={purchaseModalVisible}
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Закупка материала</Text>
            <Text style={styles.materialNameTitle}>{selectedMaterial?.name}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Количество"
              value={purchase.quantity.toString()}
              onChangeText={(text) => setPurchase({...purchase, quantity: parseInt(text) || 0})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Цена за единицу (₽)"
              value={purchase.price}
              onChangeText={(text) => setPurchase({...purchase, price: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Дата закупки"
              value={purchase.date}
              onChangeText={(text) => setPurchase({...purchase, date: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPurchaseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handlePurchase}
              >
                <Text style={styles.saveButtonText}>Закупить</Text>
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
  categories: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedCategory: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666'
  },
  selectedCategoryText: {
    color: '#fff'
  },
  listContent: {
    padding: 15
  },
  materialCard: {
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
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  materialName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10
  },
  materialQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  materialPrice: {
    fontSize: 14,
    color: '#666'
  },
  materialActions: {
    flexDirection: 'row'
  },
  actionButton: {
    padding: 5,
    marginLeft: 10
  },
  purchaseBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  purchaseBadgeText: {
    fontSize: 10,
    color: '#fff'
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  materialNameTitle: {
    fontSize: 16,
    color: '#9C27B0',
    textAlign: 'center',
    marginBottom: 20
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfInput: {
    width: '48%'
  },
  ownerSelector: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  ownerButtons: {
    flexDirection: 'row'
  },
  ownerButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedOwner: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  ownerButtonText: {
    fontSize: 16,
    color: '#666'
  },
  selectedOwnerText: {
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
  }
});