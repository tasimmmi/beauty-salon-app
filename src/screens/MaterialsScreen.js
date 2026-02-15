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

export default function MaterialsScreen() {
  const { currentUser, materials, addMaterial, updateMaterialQuantity } = useApp();
  const [activeTab, setActiveTab] = useState('common'); // 'common' или 'personal'
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'common',
    quantity: '0',
    unit: 'шт',
    price: '',
    owner: 'common'
  });
  const [purchase, setPurchase] = useState({
    quantity: '1',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Фильтрация материалов по вкладке
  const getFilteredMaterials = () => {
    if (activeTab === 'common') {
      return materials.filter(m => m.owner === 'common');
    } else {
      return materials.filter(m => m.owner === currentUser?.id || m.owner === currentUser?.name);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.price) {
      Alert.alert('Ошибка', 'Заполните название и цену');
      return;
    }

    await addMaterial({
      name: newMaterial.name,
      category: newMaterial.category,
      quantity: parseInt(newMaterial.quantity) || 0,
      unit: newMaterial.unit,
      price: parseFloat(newMaterial.price),
      owner: activeTab === 'common' ? 'common' : currentUser.id
    });

    setModalVisible(false);
    setNewMaterial({
      name: '',
      category: 'common',
      quantity: '0',
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

    // Создаем запись о закупке в финансах
    const totalCost = parseInt(purchase.quantity) * parseFloat(purchase.price);
    
    Alert.alert(
      'Успех',
      `Закупка добавлена. Сумма: ${totalCost} ₽`,
      [
        {
          text: 'OK',
          onPress: () => {
            setPurchaseModalVisible(false);
            setPurchase({ quantity: '1', price: '', date: new Date().toISOString().split('T')[0] });
          }
        }
      ]
    );
  };

  const handleUseMaterial = (material) => {
    Alert.prompt(
      'Расход материала',
      'Введите количество использованного материала:',
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Списать',
          onPress: async (quantity) => {
            const qty = parseInt(quantity);
            if (!quantity || isNaN(qty)) {
              Alert.alert('Ошибка', 'Введите корректное число');
              return;
            }
            if (qty > material.quantity) {
              Alert.alert('Ошибка', 'Недостаточно материала');
              return;
            }
            await updateMaterialQuantity(material.id, material.quantity - qty);
            Alert.alert('Успех', 'Материал списан');
          }
        }
      ],
      'plain-text',
      '1'
    );
  };

  const renderMaterialItem = ({ item }) => (
    <View style={styles.materialCard}>
      <View style={styles.materialHeader}>
        <View style={styles.materialIcon}>
          <Ionicons 
            name={item.owner === 'common' ? 'people' : 'person'} 
            size={24} 
            color="#fff" 
          />
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialName}>{item.name}</Text>
          <Text style={styles.materialUnit}>Ед. изм: {item.unit}</Text>
        </View>
      </View>
      
      <View style={styles.materialContent}>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Остаток:</Text>
          <Text style={styles.quantityValue}>{item.quantity} {item.unit}</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Цена за ед:</Text>
          <Text style={styles.priceValue}>{item.price} ₽</Text>
        </View>
      </View>
      
      <View style={styles.materialFooter}>
        <TouchableOpacity 
          style={[styles.footerButton, styles.purchaseButton]}
          onPress={() => {
            setSelectedMaterial(item);
            setPurchaseModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={18} color="#4CAF50" />
          <Text style={styles.purchaseButtonText}>Закупить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.useButton]}
          onPress={() => handleUseMaterial(item)}
        >
          <Ionicons name="remove-circle" size={18} color="#F44336" />
          <Text style={styles.useButtonText}>Использовать</Text>
        </TouchableOpacity>
      </View>
      
      {item.isPurchase && (
        <View style={styles.purchaseBadge}>
          <Text style={styles.purchaseBadgeText}>Закупка</Text>
        </View>
      )}
    </View>
  );

  const filteredMaterials = getFilteredMaterials();

  return (
    <View style={styles.container}>
      {/* Вкладки */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'common' && styles.activeTab]}
          onPress={() => setActiveTab('common')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'common' ? '#9C27B0' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'common' && styles.activeTabText]}>
            Общие материалы
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'personal' ? '#9C27B0' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Личные материалы
          </Text>
        </TouchableOpacity>
      </View>

      {/* Заголовок и кнопка добавления */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {activeTab === 'common' ? 'Общие материалы' : 'Мои материалы'}
          </Text>
          <Text style={styles.subtitle}>
            {filteredMaterials.length} материалов
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Список материалов */}
      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterialItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'common' ? 'people-outline' : 'person-outline'} 
              size={60} 
              color="#ccc" 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'common' ? 'Нет общих материалов' : 'Нет личных материалов'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'common' 
                ? 'Добавьте общие материалы для всего салона'
                : 'Добавьте свои личные материалы'
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Добавить материал</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Модальное окно добавления материала */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setNewMaterial({
            name: '',
            category: 'common',
            quantity: '0',
            unit: 'шт',
            price: '',
            owner: 'common'
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Добавить {activeTab === 'common' ? 'общий' : 'личный'} материал
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Название материала *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: Ватные диски"
                  value={newMaterial.name}
                  onChangeText={(text) => setNewMaterial({...newMaterial, name: text})}
                />
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Количество</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={newMaterial.quantity}
                    onChangeText={(text) => setNewMaterial({...newMaterial, quantity: text})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Единица изм.</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="шт"
                    value={newMaterial.unit}
                    onChangeText={(text) => setNewMaterial({...newMaterial, unit: text})}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Цена за единицу (₽) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  value={newMaterial.price}
                  onChangeText={(text) => setNewMaterial({...newMaterial, price: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#9C27B0" />
                <Text style={styles.infoText}>
                  Материал будет добавлен в раздел "{activeTab === 'common' ? 'Общие' : 'Личные'}"
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
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

      {/* Модальное окно закупки */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={purchaseModalVisible}
        onRequestClose={() => {
          setPurchaseModalVisible(false);
          setPurchase({ quantity: '1', price: '', date: new Date().toISOString().split('T')[0] });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Закупка материала</Text>
              <TouchableOpacity onPress={() => {
                setPurchaseModalVisible(false);
                setPurchase({ quantity: '1', price: '', date: new Date().toISOString().split('T')[0] });
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.selectedMaterialInfo}>
              <Text style={styles.selectedMaterialName}>{selectedMaterial?.name}</Text>
              <Text style={styles.selectedMaterialCurrent}>
                Текущий остаток: {selectedMaterial?.quantity} {selectedMaterial?.unit}
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Количество для закупки</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите количество"
                value={purchase.quantity}
                onChangeText={(text) => setPurchase({...purchase, quantity: text})}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Цена за единицу (₽)</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите цену"
                value={purchase.price}
                onChangeText={(text) => setPurchase({...purchase, price: text})}
                keyboardType="numeric"
              />
            </View>

            {purchase.price && purchase.quantity && (
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Итого:</Text>
                <Text style={styles.totalValue}>
                  {parseInt(purchase.quantity) * parseFloat(purchase.price)} ₽
                </Text>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPurchaseModalVisible(false);
                  setPurchase({ quantity: '1', price: '', date: new Date().toISOString().split('T')[0] });
                }}
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
    backgroundColor: '#f5f5f5'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6
  },
  activeTab: {
    backgroundColor: '#f3e5f5',
    borderWidth: 1,
    borderColor: '#9C27B0'
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#9C27B0',
    fontWeight: '600'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
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
  materialCard: {
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
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  materialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  materialInfo: {
    flex: 1
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  materialUnit: {
    fontSize: 12,
    color: '#999'
  },
  materialContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  quantityContainer: {
    flex: 1,
    alignItems: 'center'
  },
  quantityLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  priceContainer: {
    flex: 1,
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  purchaseButton: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#a5d6a7'
  },
  purchaseButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600'
  },
  useButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a'
  },
  useButtonText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '600'
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
    color: '#fff',
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 18,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
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
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 18,
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
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  selectedMaterialInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  selectedMaterialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  selectedMaterialCurrent: {
    fontSize: 14,
    color: '#666'
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 15,
    marginTop: 8,
    marginBottom: 16
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9C27B0'
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
  }
});