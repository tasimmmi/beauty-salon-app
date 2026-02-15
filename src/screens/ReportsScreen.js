import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function ReportsScreen() {
  const { currentUser, appointments, materials, finances, services } = useApp();
  const [period, setPeriod] = useState('month');
  const [reportType, setReportType] = useState('finance');

  const screenWidth = Dimensions.get('window').width - 40;

  // Безопасное получение данных с проверками
  const safeAppointments = appointments || [];
  const safeMaterials = materials || [];
  const safeFinances = finances || [];
  const safeServices = services || [];

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
      case 'all':
        startDate = new Date(2020, 0, 1); // С 1 января 2020 года
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    return {
      appointments: safeAppointments.filter(a => 
        a?.cosmetologistId === currentUser?.id && 
        new Date(a?.date) >= startDate
      ),
      materials: safeMaterials.filter(m => 
        (m?.owner === 'common' || m?.owner === currentUser?.id) &&
        m?.isPurchase &&
        new Date(m?.purchaseDate) >= startDate
      ),
      finances: safeFinances.filter(f => 
        (f?.owner === 'common' || f?.owner === currentUser?.id) &&
        new Date(f?.date) >= startDate
      ),
      services: safeServices.filter(s => 
        s?.cosmetologistId === currentUser?.id
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
      default:
        return calculateFinanceReport(data);
    }
  };

  const calculateFinanceReport = (data) => {
    const income = (data.finances || [])
      .filter(f => f?.type === 'income')
      .reduce((sum, f) => sum + (f?.amount || 0), 0);
    
    const expenses = (data.finances || [])
      .filter(f => f?.type === 'expense')
      .reduce((sum, f) => sum + (f?.amount || 0), 0);
    
    const appointmentsIncome = (data.appointments || [])
      .filter(a => a?.status === 'completed')
      .reduce((sum, a) => sum + (parseFloat(a?.price) || 0), 0);
    
    const materialsExpenses = (data.materials || [])
      .reduce((sum, m) => sum + ((m?.price || 0) * (m?.quantity || 0)), 0);

    const totalIncome = income + appointmentsIncome;
    const totalExpenses = expenses + materialsExpenses;
    const profit = totalIncome - totalExpenses;

    // Статистика по статусам
    const totalAppointments = data.appointments?.length || 0;
    const completedAppointments = (data.appointments || []).filter(a => a?.status === 'completed').length;
    const cancelledAppointments = (data.appointments || []).filter(a => a?.status === 'cancelled').length;
    const scheduledAppointments = (data.appointments || []).filter(a => a?.status === 'scheduled').length;
    const confirmedAppointments = (data.appointments || []).filter(a => a?.status === 'confirmed').length;

    return {
      totalIncome,
      totalExpenses,
      profit,
      appointmentsCount: totalAppointments,
      completedAppointments,
      cancelledAppointments,
      scheduledAppointments,
      confirmedAppointments,
      appointmentsIncome,
      materialsExpenses,
      otherIncome: income,
      otherExpenses: expenses,
      averageBill: totalAppointments > 0 
        ? (appointmentsIncome / totalAppointments).toFixed(2)
        : 0,
      completionRate: totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
        : 0
    };
  };

  const calculateMaterialsReport = (data) => {
    const materialsByCategory = {};
    let totalSpent = 0;
    
    (data.materials || []).forEach(m => {
      const category = m?.category || 'other';
      const cost = (m?.price || 0) * (m?.quantity || 0);
      totalSpent += cost;
      
      if (!materialsByCategory[category]) {
        materialsByCategory[category] = {
          count: 0,
          totalCost: 0,
          items: []
        };
      }
      materialsByCategory[category].count += m?.quantity || 0;
      materialsByCategory[category].totalCost += cost;
      materialsByCategory[category].items.push(m);
    });

    return {
      byCategory: materialsByCategory,
      totalSpent,
      totalItems: (data.materials || []).reduce((sum, m) => sum + (m?.quantity || 0), 0)
    };
  };

  const report = calculateReport();

  const formatDuration = (minutes) => {
    if (!minutes) return '0 мин';
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getPeriodLabel = () => {
    switch(period) {
      case 'week': return 'За последнюю неделю';
      case 'month': return 'За последний месяц';
      case 'year': return 'За последний год';
      case 'all': return 'За все время';
      default: return 'За выбранный период';
    }
  };

  const renderFinanceReport = () => (
    <View style={styles.reportContainer}>
      <Text style={styles.reportTitle}>Финансовый отчет</Text>
      
      <View style={styles.periodSummary}>
        <Text style={styles.periodText}>{getPeriodLabel()}</Text>
      </View>
      
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Ionicons name="arrow-up" size={24} color="#4CAF50" />
          <Text style={styles.summaryLabel}>Доход</Text>
          <Text style={styles.summaryValue}>{formatCurrency(report.totalIncome)}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Ionicons name="arrow-down" size={24} color="#F44336" />
          <Text style={styles.summaryLabel}>Расход</Text>
          <Text style={styles.summaryValue}>{formatCurrency(report.totalExpenses)}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.profitCard]}>
          <Ionicons 
            name={report.profit >= 0 ? "trending-up" : "trending-down"} 
            size={24} 
            color={report.profit >= 0 ? "#4CAF50" : "#F44336"} 
          />
          <Text style={styles.summaryLabel}>Прибыль</Text>
          <Text style={[
            styles.summaryValue,
            report.profit >= 0 ? styles.profitPositive : styles.profitNegative
          ]}>
            {formatCurrency(report.profit)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report.appointmentsCount}</Text>
          <Text style={styles.statLabel}>Всего записей</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report.completedAppointments}</Text>
          <Text style={styles.statLabel}>Завершено</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{report.completionRate}%</Text>
          <Text style={styles.statLabel}>Выполнения</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Детализация</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Средний чек:</Text>
          <Text style={styles.detailValue}>{formatCurrency(report.averageBill)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Доход от услуг:</Text>
          <Text style={styles.detailValue}>{formatCurrency(report.appointmentsIncome)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Прочие доходы:</Text>
          <Text style={styles.detailValue}>{formatCurrency(report.otherIncome)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Расход на материалы:</Text>
          <Text style={styles.detailValue}>{formatCurrency(report.materialsExpenses)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Прочие расходы:</Text>
          <Text style={styles.detailValue}>{formatCurrency(report.otherExpenses)}</Text>
        </View>
      </View>

      <View style={styles.statusBreakdownCard}>
        <Text style={styles.detailsTitle}>Статусы записей</Text>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.statusLabel}>Запланировано:</Text>
          <Text style={styles.statusCount}>{report.scheduledAppointments}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.statusLabel}>Подтверждено:</Text>
          <Text style={styles.statusCount}>{report.confirmedAppointments}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statusLabel}>Завершено:</Text>
          <Text style={styles.statusCount}>{report.completedAppointments}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.statusLabel}>Отменено:</Text>
          <Text style={styles.statusCount}>{report.cancelledAppointments}</Text>
        </View>
      </View>

      {report.appointmentsCount > 0 && (
        <View style={styles.popularServicesCard}>
          <Text style={styles.detailsTitle}>Популярные услуги</Text>
          <Text style={styles.comingSoonText}>
            Статистика по услугам будет доступна после нескольких записей
          </Text>
        </View>
      )}
    </View>
  );

  const renderMaterialsReport = () => {
    const materialsData = report;
    const hasData = Object.keys(materialsData.byCategory || {}).length > 0;

    return (
      <View style={styles.reportContainer}>
        <Text style={styles.reportTitle}>Отчет по материалам</Text>
        
        <View style={styles.periodSummary}>
          <Text style={styles.periodText}>{getPeriodLabel()}</Text>
        </View>

        <View style={styles.materialsSummaryCards}>
          <View style={styles.materialSummaryCard}>
            <Ionicons name="cube" size={24} color="#9C27B0" />
            <Text style={styles.materialSummaryLabel}>Всего закуплено</Text>
            <Text style={styles.materialSummaryValue}>{materialsData.totalItems || 0} ед.</Text>
          </View>
          
          <View style={styles.materialSummaryCard}>
            <Ionicons name="cash" size={24} color="#9C27B0" />
            <Text style={styles.materialSummaryLabel}>Потрачено всего</Text>
            <Text style={styles.materialSummaryValue}>{formatCurrency(materialsData.totalSpent || 0)}</Text>
          </View>
        </View>

        {!hasData ? (
          <View style={styles.emptyReportContainer}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <Text style={styles.emptyReportTitle}>Нет данных о закупках</Text>
            <Text style={styles.emptyReportText}>
              {period === 'all' 
                ? 'У вас еще не было закупок материалов'
                : 'За этот период не было закупок материалов'}
            </Text>
          </View>
        ) : (
          Object.keys(materialsData.byCategory).map((category) => (
            <View key={category} style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>
                {category === 'common' ? 'Общие материалы' : 
                 category === currentUser?.id ? 'Личные материалы' :
                 `Материалы ${category}`}
              </Text>
              <View style={styles.categoryStats}>
                <View style={styles.categoryStat}>
                  <Text style={styles.categoryStatLabel}>Количество:</Text>
                  <Text style={styles.categoryStatValue}>{materialsData.byCategory[category].count}</Text>
                </View>
                <View style={styles.categoryStat}>
                  <Text style={styles.categoryStatLabel}>Сумма:</Text>
                  <Text style={styles.categoryStatValue}>
                    {formatCurrency(materialsData.byCategory[category].totalCost)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

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
            <Ionicons 
              name="wallet-outline" 
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
            <Ionicons 
              name="cube-outline" 
              size={20} 
              color={reportType === 'materials' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.controlText,
              reportType === 'materials' && styles.activeControlText
            ]}>Материалы</Text>
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

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'all' && styles.activePeriod
          ]}
          onPress={() => setPeriod('all')}
        >
          <Text style={[
            styles.periodText,
            period === 'all' && styles.activePeriodText
          ]}>Все</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reportType === 'finance' && renderFinanceReport()}
        {reportType === 'materials' && renderMaterialsReport()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
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
  controls: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
    gap: 8
  },
  periodButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  activePeriod: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0'
  },
  periodText: {
    fontSize: 13,
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
    marginBottom: 10
  },
  periodSummary: {
    marginBottom: 15
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  summaryCards: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
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
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginBottom: 2
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  profitPositive: {
    color: '#4CAF50'
  },
  profitNegative: {
    color: '#F44336'
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#999'
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 13,
    color: '#666'
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333'
  },
  statusBreakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  statusCount: {
    marginLeft: 'auto',
    fontWeight: '600',
    color: '#333'
  },
  popularServicesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  comingSoonText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    padding: 15,
    fontStyle: 'italic'
  },
  materialsSummaryCards: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8
  },
  materialSummaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  materialSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2
  },
  materialSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0'
  },
  emptyReportContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  emptyReportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4
  },
  emptyReportText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center'
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  categoryStats: {
    gap: 6
  },
  categoryStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryStatLabel: {
    fontSize: 13,
    color: '#666'
  },
  categoryStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333'
  }
});