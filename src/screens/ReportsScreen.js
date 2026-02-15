import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';

export default function ReportsScreen() {
  const { currentUser, appointments, materials, finances, clients } = useApp();
  const [period, setPeriod] = useState('month');
  const [reportType, setReportType] = useState('finance');

  const screenWidth = Dimensions.get('window').width - 40;

  const getPeriodData = () => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    return {
      appointments: appointments.filter(a => 
        a.cosmetologistId === currentUser?.id && 
        new Date(a.date) >= startDate
      ),
      materials: materials.filter(m => 
        (m.owner === 'common' || m.owner === currentUser?.id) &&
        m.isPurchase &&
        new Date(m.purchaseDate) >= startDate
      ),
      finances: finances.filter(f => 
        (f.owner === 'common' || f.owner === currentUser?.id) &&
        new Date(f.date) >= startDate
      ),
      clients: clients.filter(c => 
        c.cosmetologistId === currentUser?.id
      )
    };
  };

  const calculateReport = () => {
    const data = getPeriodData();
    
    switch (reportType) {
      case 'finance':
        return calculateFinanceReport(data);
      case 'materials':
        return calculateMaterialsReport(data);
      case 'clients':
        return calculateClientsReport(data);
      default:
        return calculateFinanceReport(data);
    }
  };

  const calculateFinanceReport = (data) => {
    const income = data.finances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const expenses = data.finances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const appointmentsIncome = data.appointments
      .reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    
    const materialsExpenses = data.materials
      .reduce((sum, m) => sum + (m.price * m.quantity), 0);

    return {
      totalIncome: income + appointmentsIncome,
      totalExpenses: expenses + materialsExpenses,
      profit: (income + appointmentsIncome) - (expenses + materialsExpenses),
      appointmentsCount: data.appointments.length,
      appointmentsIncome,
      materialsExpenses,
      otherIncome: income,
      otherExpenses: expenses
    };
  };

  const calculateMaterialsReport = (data) => {
    const materialsByCategory = {};
    
    data.materials.forEach(m => {
      if (!materialsByCategory[m.category]) {
        materialsByCategory[m.category] = {
          count: 0,
          totalCost: 0,
          items: []
        };
      }
      materialsByCategory[m.category].count += m.quantity;
      materialsByCategory[m.category].totalCost += m.price * m.quantity;
      materialsByCategory[m.category].items.push(m);
    });

    return materialsByCategory;
  };

  const calculateClientsReport = (data) => {
    const newClients = data.clients.filter(c => 
      new Date(c.createdAt) >= new Date(new Date().setMonth(new Date().getMonth() - 1))
    ).length;

    const totalVisits = data.appointments.length;
    const averageBill = data.appointments.length > 0
      ? data.appointments.reduce((sum, a) => sum + parseFloat(a.price || 0), 0) / data.appointments.length
      : 0;

    return {
      totalClients: data.clients.length,
      newClients,
      totalVisits,
      averageBill,
      frequentClients: data.clients.filter(c => c.visits?.length >= 3).length
    };
  };

  const report = calculateReport();

  const renderFinanceReport = () => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Финансовый отчет</Text>
      
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Text style={styles.summaryLabel}>Доход</Text>
          <Text style={styles.summaryValue}>{report.totalIncome} ₽</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Text style={styles.summaryLabel}>Расход</Text>
          <Text style={styles.summaryValue}>{report.totalExpenses} ₽</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.profitCard]}>
          <Text style={styles.summaryLabel}>Прибыль</Text>
          <Text style={[
            styles.summaryValue,
            styles.profitText,
            report.profit >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {report.profit} ₽
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Детализация</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Количество записей:</Text>
          <Text style={styles.detailValue}>{report.appointmentsCount}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Доход от услуг:</Text>
          <Text style={styles.detailValue}>{report.appointmentsIncome} ₽</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Прочие доходы:</Text>
          <Text style={styles.detailValue}>{report.otherIncome} ₽</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Расход на материалы:</Text>
          <Text style={styles.detailValue}>{report.materialsExpenses} ₽</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Прочие расходы:</Text>
          <Text style={styles.detailValue}>{report.otherExpenses} ₽</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Соотношение доходов и расходов</Text>
        <PieChart
          data={[
            {
              name: 'Доходы',
              population: report.totalIncome,
              color: '#4CAF50',
              legendFontColor: '#333',
              legendFontSize: 12
            },
            {
              name: 'Расходы',
              population: report.totalExpenses,
              color: '#F44336',
              legendFontColor: '#333',
              legendFontSize: 12
            }
          ]}
          width={screenWidth}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </View>
  );

  const renderMaterialsReport = () => {
    const materialsData = report;
    const pieData = Object.keys(materialsData).map((key, index) => ({
      name: key === 'common' ? 'Общие' : key,
      population: materialsData[key].totalCost,
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: '#333',
      legendFontSize: 12
    }));

    return (
      <View style={styles.reportContainer}>
        <Text style={styles.reportTitle}>Отчет по материалам</Text>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Распределение затрат</Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.emptyText}>Нет данных за период</Text>
          )}
        </View>

        {Object.keys(materialsData).map((category) => (
          <View key={category} style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>
              {category === 'common' ? 'Общие материалы' : `Материалы ${category}`}
            </Text>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryStat}>
                Количество: {materialsData[category].count}
              </Text>
              <Text style={styles.categoryStat}>
                Сумма: {materialsData[category].totalCost} ₽
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderClientsReport = () => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Отчет по клиентам</Text>
      
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.clientCard]}>
          <Text style={styles.summaryLabel}>Всего клиентов</Text>
          <Text style={styles.summaryValue}>{report.totalClients}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.newClientCard]}>
          <Text style={styles.summaryLabel}>Новых</Text>
          <Text style={styles.summaryValue}>{report.newClients}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.visitsCard]}>
          <Text style={styles.summaryLabel}>Визитов</Text>
          <Text style={styles.summaryValue}>{report.totalVisits}</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Статистика</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Средний чек:</Text>
          <Text style={styles.detailValue}>{report.averageBill.toFixed(2)} ₽</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Постоянные клиенты:</Text>
          <Text style={styles.detailValue}>{report.frequentClients}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Отчеты и аналитика</Text>
      </View>

      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              reportType === 'finance' && styles.activeControl
            ]}
            onPress={() => setReportType('finance')}
          >
            <Icon 
              name="account-balance-wallet" 
              size={20} 
              color={reportType === 'finance' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.controlText,
              reportType === 'finance' && styles.activeControlText
            ]}>Финансы</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              reportType === 'materials' && styles.activeControl
            ]}
            onPress={() => setReportType('materials')}
          >
            <Icon 
              name="inventory" 
              size={20} 
              color={reportType === 'materials' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.controlText,
              reportType === 'materials' && styles.activeControlText
            ]}>Материалы</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              reportType === 'clients' && styles.activeControl
            ]}
            onPress={() => setReportType('clients')}
          >
            <Icon 
              name="people" 
              size={20} 
              color={reportType === 'clients' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.controlText,
              reportType === 'clients' && styles.activeControlText
            ]}>Клиенты</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'week' && styles.activePeriod
          ]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[
            styles.periodText,
            period === 'week' && styles.activePeriodText
          ]}>Неделя</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'month' && styles.activePeriod
          ]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[
            styles.periodText,
            period === 'month' && styles.activePeriodText
          ]}>Месяц</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'year' && styles.activePeriod
          ]}
          onPress={() => setPeriod('year')}
        >
          <Text style={[
            styles.periodText,
            period === 'year' && styles.activePeriodText
          ]}>Год</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reportType === 'finance' && renderFinanceReport()}
        {reportType === 'materials' && renderMaterialsReport()}
        {reportType === 'clients' && renderClientsReport()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  controls: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  activeControl: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  controlText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  activeControlText: {
    color: '#fff'
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f8f9fa'
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  activePeriod: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  periodText: {
    fontSize: 14,
    color: '#666'
  },
  activePeriodText: {
    color: '#fff'
  },
  content: {
    flex: 1,
    padding: 15
  },
  reportContainer: {
    paddingBottom: 20
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  summaryCards: {
    flexDirection: 'row',
    marginBottom: 20
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
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
  clientCard: {
    borderTopColor: '#2196F3',
    borderTopWidth: 3
  },
  newClientCard: {
    borderTopColor: '#4CAF50',
    borderTopWidth: 3
  },
  visitsCard: {
    borderTopColor: '#FF9800',
    borderTopWidth: 3
  },
  profitText: {
    fontSize: 20
  },
  profitPositive: {
    color: '#4CAF50'
  },
  profitNegative: {
    color: '#F44336'
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  categoryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  categoryStat: {
    fontSize: 14,
    color: '#666'
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20
  }
});