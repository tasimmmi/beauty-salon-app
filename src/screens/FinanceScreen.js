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

export default function FinanceScreen() {
  const { currentUser, finances, addFinanceRecord } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    type: 'expense',
    category: 'rent',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    owner: 'common'
  });

  const expenseCategories = [
    { id: 'rent', name: 'Аренда', icon: 'home' },
    { id: 'water', name: 'Вода', icon: 'water-drop' },
    { id: 'supplies', name: 'Бытовые', icon: 'cleaning-services' },
    { id: 'equipment', name: 'Оборудование', icon: 'build' },
    { id: 'marketing', name: 'Маркетинг', icon: 'campaign' },
    { id: 'other', name: 'Прочее', icon: 'more-horiz' }
  ];

  const incomeCategories = [
    { id: 'service', name: 'Услуги', icon: 'spa' },
    { id: 'product', name: 'Продажи', icon: 'shopping-bag' }
  ];

  const getFilteredRecords = () => {
    return finances.filter(r => 
      r.owner === 'common' || r.owner === currentUser?.id || r.owner === currentUser?.name
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleAddRecord = async () => {
    if (!newRecord.amount || !newRecord.description) {
      Alert.alert('Ошибка', 'Заполните сумму и описание');
      return;
    }

    await addFinanceRecord({
      ...newRecord,
      amount: parseFloat(newRecord.amount),
      createdBy: currentUser.id
    });

    setModalVisible(false);
    setNewRecord({
      type: 'expense',
      category: 'rent',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      owner: 'common'
    });
    Alert.alert('Успех', 'Запись добавлена');
  };

  const calculateTotals = () => {
    const records = getFilteredRecords();
    const income = records
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    const expenses = records
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    const profit = income - expenses;

    return { income, expenses, profit };
  };

  const renderRecordItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.recordCard,
        item.type === 'income' ? styles.incomeCard : styles.expenseCard
      ]}
      onPress={() => setSelectedRecord(item)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordCategory}>
          <Icon 
            name={item.type === 'income' ? 'arrow-upward' : 'arrow-downward'} 
            size={20} 
            color={item.type === 'income' ? '#4CAF50' : '#F44336'} 
          />
          <Text style={styles.recordCategoryText}>
            {item.type === 'income' ? 'Доход' : 'Расход'}
          </Text>
        </View>
        <Text style={[
          styles.recordAmount,
          item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
        ]}>
          {item.type === 'income' ? '+' : '-'}{item.amount} ₽
        </Text>
      </View>
      
      <Text style={styles.recordDescription}>{item.description}</Text>
      
      <View style={styles.recordFooter}>
        <Text style={styles.recordDate}>
          {new Date(item.date).toLocaleDateString('ru-RU')}
        </Text>
        <View style={styles.recordBadge}>
          <Text style={styles.recordBadgeText}>
            {item.owner === 'common' ? 'Общий' : 'Личный'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const totals = calculateTotals();

  return (
    <View style={styles.container}>
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Text style={styles.summaryLabel}>Доход</Text>
          <Text style={styles.summaryValue}>{totals.income} ₽</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Text style={styles.summaryLabel}>Расход</Text>
          <Text style={styles.summaryValue}>{totals.expenses} ₽</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.profitCard]}>
          <Text style={styles.summaryLabel}>Прибыль</Text>
          <Text style={[
            styles.summaryValue,
            totals.profit >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {totals.profit} ₽
          </Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Финансовые операции</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredRecords()}
        renderItem={renderRecordItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-balance-wallet" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Нет финансовых операций</Text>
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
            <Text style={styles.modalTitle}>Новая операция</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newRecord.type === 'income' && styles.selectedIncomeType
                ]}
                onPress={() => setNewRecord({...newRecord, type: 'income'})}
              >
                <Icon name="arrow-upward" size={20} color={newRecord.type === 'income' ? '#fff' : '#4CAF50'} />
                <Text style={[
                  styles.typeButtonText,
                  newRecord.type === 'income' && styles.selectedTypeText
                ]}>Доход</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newRecord.type === 'expense' && styles.selectedExpenseType
                ]}
                onPress={() => setNewRecord({...newRecord, type: 'expense'})}
              >
                <Icon name="arrow-downward" size={20} color={newRecord.type === 'expense' ? '#fff' : '#F44336'} />
                <Text style={[
                  styles.typeButtonText,
                  newRecord.type === 'expense' && styles.selectedTypeText
                ]}>Расход</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Категория:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {(newRecord.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    newRecord.category === cat.id && styles.selectedCategory
                  ]}
                  onPress={() => setNewRecord({...newRecord, category: cat.id})}
                >
                  <Icon 
                    name={cat.icon} 
                    size={18} 
                    color={newRecord.category === cat.id ? '#fff' : '#666'} 
                  />
                  <Text style={[
                    styles.categoryText,
                    newRecord.category === cat.id && styles.selectedCategoryText
                  ]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TextInput
              style={styles.input}
              placeholder="Сумма (₽)"
              value={newRecord.amount}
              onChangeText={(text) => setNewRecord({...newRecord, amount: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Описание"
              value={newRecord.description}
              onChangeText={(text) => setNewRecord({...newRecord, description: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Дата (ГГГГ-ММ-ДД)"
              value={newRecord.date}
              onChangeText={(text) => setNewRecord({...newRecord, date: text})}
            />
            
            <View style={styles.ownerSelector}>
              <Text style={styles.label}>Тип:</Text>
              <View style={styles.ownerButtons}>
                <TouchableOpacity
                  style={[
                    styles.ownerButton,
                    newRecord.owner === 'common' && styles.selectedOwner
                  ]}
                  onPress={() => setNewRecord({...newRecord, owner: 'common'})}
                >
                  <Text style={[
                    styles.ownerButtonText,
                    newRecord.owner === 'common' && styles.selectedOwnerText
                  ]}>Общий</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.ownerButton,
                    newRecord.owner === currentUser?.id && styles.selectedOwner
                  ]}
                  onPress={() => setNewRecord({...newRecord, owner: currentUser.id})}
                >
                  <Text style={[
                    styles.ownerButtonText,
                    newRecord.owner === currentUser?.id && styles.selectedOwnerText
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
                onPress={handleAddRecord}
              >
                <Text style={styles.saveButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedRecord && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedRecord}
          onRequestClose={() => setSelectedRecord(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Детали операции</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Тип:</Text>
                <Text style={[
                  styles.detailValue,
                  selectedRecord.type === 'income' ? styles.incomeText : styles.expenseText
                ]}>
                  {selectedRecord.type === 'income' ? 'Доход' : 'Расход'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Категория:</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.category}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Сумма:</Text>
                <Text style={[
                  styles.detailValue,
                  styles.amountValue
                ]}>
                  {selectedRecord.amount} ₽
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Описание:</Text>
                <Text style={styles.detailValue}>{selectedRecord.description}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Дата:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedRecord.date).toLocaleDateString('ru-RU')}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Тип:</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.owner === 'common' ? 'Общий' : 'Личный'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setSelectedRecord(null)}
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
  summaryCards: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f8f9fa'
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  incomeCard: {
    borderTopColor: '#4CAF50',
    borderTopWidth: 3
  },
  expenseCard: {
    borderTopColor: '#F44336',
    borderTopWidth: 3
  },
  profitCard: {
    borderTopColor: '#9C27B0',
    borderTopWidth: 3
  },
  profitPositive: {
    color: '#4CAF50'
  },
  profitNegative: {
    color: '#F44336'
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
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  recordCategory: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  recordCategoryText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666'
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  incomeAmount: {
    color: '#4CAF50'
  },
  expenseAmount: {
    color: '#F44336'
  },
  recordDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recordDate: {
    fontSize: 12,
    color: '#999'
  },
  recordBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  recordBadgeText: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedIncomeType: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  selectedExpenseType: {
    backgroundColor: '#F44336',
    borderColor: '#F44336'
  },
  typeButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#666'
  },
  selectedTypeText: {
    color: '#fff'
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 10
  },
  categoriesScroll: {
    marginBottom: 15
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
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16
  },
  ownerSelector: {
    marginBottom: 20
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
  closeButton: {
    backgroundColor: '#9C27B0',
    marginTop: 20
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
  },
  incomeText: {
    color: '#4CAF50'
  },
  expenseText: {
    color: '#F44336'
  },
  amountValue: {
    fontSize: 18,
    color: '#9C27B0'
  }
});