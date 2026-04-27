import React, { useEffect, useMemo, useState } from 'react';
import type {
  AnalysisPageProps,
  AnalysisResult,
  DetectAnomaliesResponse,
  ForcastingTrendResponse,
  ListTransactionResponse,
  MetricDriver,
  SavingsSnapshot,
  SavingSuggestionResponse,
  SuggestionCard,
  Transaction,
  TrendDirection,
} from './types';
import { ResponsiveContainer,
         LineChart,
         Line,
         BarChart,
         Bar,
         LabelList,
         CartesianGrid,
         XAxis,
         YAxis,
         Tooltip,
         Legend,} from 'recharts';
import { api } from '../../lib/api';
import { Charts } from '../../components/Charts/Charts';

const trendLabel: Record<'up' | 'down' | 'stable', string> = {up: 'Tăng',
                                                              down: 'Giảm',
                                                              stable: 'Ổn định',};
// Làm tròn số
const formatMoney   = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} VND`;
const formatPercent = (value: number) => `${Math.abs(value).toFixed(0)}%`;
const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;

// Xử lý dữ liệu trend
const getMetricValues = (
  monthlySeries: AnalysisResult['trend']['monthlySeries'],
  metric: 'expense' | 'income',
) => monthlySeries.map((point) => (metric === 'expense' ? point.expense : point.income));

const getTolerance = (values: number[]) => {
  const absoluteValues = values.map((amount) => Math.abs(amount)).filter((amount) => amount > 0);

  if (absoluteValues.length === 0) {
    return 50000;
  }

  const sortedValues = [...absoluteValues].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];

  return Math.max(50000, median * 0.03);
};

// Xác định hướng xu hướng tăng/giảm/ổn định dựa trên delta và độ nhạy
const getDirectionFromDelta = (delta: number, tolerance: number): TrendDirection => {
  if (delta > tolerance) {
    return 'up';
  }

  if (delta < -tolerance) {
    return 'down';
  }

  return 'stable';
};

// Xử lý dữ liệu trend
const getTrendDirection = (
  monthlySeries: AnalysisResult['trend']['monthlySeries'],
  metric: 'expense' | 'income',
): TrendDirection => {
  if (monthlySeries.length < 2) {
    return 'stable';
  }

  const values = getMetricValues(monthlySeries, metric);
  const tolerance = getTolerance(values);
  const lastDelta = values[values.length - 1] - values[values.length - 2];
  return getDirectionFromDelta(lastDelta, tolerance);
};


const categoryActionMap: Record<string, { unit: string; action: string }> = {
  'food & dining': { unit   : 'Bữa ăn ngoài',               
                     action : 'Giảm 2 bữa ăn ngoài mỗi tuần' },
  food:            { unit   : 'Bữa ăn ngoài',               
                     action : 'Giảm 2 bữa ăn ngoài mỗi tuần' },
  dining:          { unit   : 'Bữa ăn ngoài',               
                     action : 'Giảm 2 bữa ăn ngoài mỗi tuần' },
  groceries:       { unit   : 'Lần đi chợ/siêu thị',          
                     action : 'Bỏ qua 1 lần đi mua sắm ngẫu hứng mỗi tuần' },
  transport:       { unit   : 'Chuyến gọi xe (Grab/Be...)',      
                     action : 'Thay thế 2 chuyến xe công nghệ mỗi tuần bằng phương tiện công cộng' },
  transportation:  { unit   : 'Chuyến gọi xe (Grab/Be...)',      
                     action : 'Thay thế 2 chuyến xe công nghệ mỗi tuần bằng phương tiện công cộng' },
  shopping:        { unit   : 'Mua sắm không thiết yếu', 
                     action : 'Cắt giảm 2 khoản mua sắm không thiết yếu mỗi tuần' },
  entertainment:   { unit   : 'Hoạt động có phí',         
                     action : 'Thay thế 1 hoạt động giải trí có phí mỗi tuần bằng một lựa chọn miễn phí' },
};

const buildCategoryAction = (category: string) => {
    const normalizedCategory = category.trim().toLowerCase();
    return categoryActionMap[normalizedCategory] || {unit: 'Mua sắm không thiết yếu',
                                                   action: `Cắt giảm 2 khoản ${category} mua sắm không thiết yếu mỗi tuần`,};};

const getSavingsSnapshot = (monthlySeries: AnalysisResult['trend']['monthlySeries']): SavingsSnapshot => {
  if (!monthlySeries.length) {
    return {
      rate: null,
      monthlySurplus: 0,
      suggestedAllocation: 0,
    };
  }

  const latestMonth         = monthlySeries[monthlySeries.length - 1];
  const monthlySurplus      = Math.max(0, latestMonth.income - latestMonth.expense);
  const rate                = latestMonth.income > 0 ? (monthlySurplus / latestMonth.income) * 100 : null;
  const baselineTarget      = monthlySurplus > 0 ? monthlySurplus * 0.6 : latestMonth.income * 0.08;
  const suggestedAllocation = latestMonth.income > 0 ? Math.max(50000, Math.round(baselineTarget / 1000) * 1000) : 0;

  return {
    rate,
    monthlySurplus,
    suggestedAllocation,
  };
};

const getMainDriver = (
  transactions: Transaction[],
  metric: 'expense' | 'income',
): MetricDriver | null => {
  const normalizedTransactions = transactions
    .filter((item) => (metric === 'expense' ? item.type === 'expense' : item.type === 'income'))
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date));

  if (normalizedTransactions.length === 0) {
    return null;
  }

  const months = Array.from(new Set(normalizedTransactions.map((item) => item.date.slice(0, 7)))).sort();

  if (months.length < 2) {
    return null;
  }

  const previousMonth = months[months.length - 2];
  const currentMonth = months[months.length - 1];

  const previousTotals = new Map<string, number>();
  const currentTotals = new Map<string, number>();

  normalizedTransactions.forEach((item) => {
    const monthKey = item.date.slice(0, 7);
    const detailTotals = new Map<string, number>();
    item.details.forEach((detail) => {
      detailTotals.set(detail.categoryName, (detailTotals.get(detail.categoryName) || 0) + detail.amount);
    });

    if (monthKey === previousMonth) {
      detailTotals.forEach((amount, categoryName) => {
        previousTotals.set(categoryName, (previousTotals.get(categoryName) || 0) + amount);
      });
    }

    if (monthKey === currentMonth) {
      detailTotals.forEach((amount, categoryName) => {
        currentTotals.set(categoryName, (currentTotals.get(categoryName) || 0) + amount);
      });
    }
  });

  const categorySet = new Set<string>([...previousTotals.keys(), ...currentTotals.keys()]);
  const candidates: MetricDriver[] = [];

  categorySet.forEach((category) => {
    const previousValue = previousTotals.get(category) || 0;
    const currentValue = currentTotals.get(category) || 0;
    const deltaAmount = currentValue - previousValue;

    if (deltaAmount === 0) {
      return;
    }

    const changePercent = previousValue > 0 ? (deltaAmount / previousValue) * 100 : 100;

    candidates.push({
      category,
      changePercent,
      deltaAmount,
    });
  });

  if (!candidates.length) {
    return null;
  }

  return candidates.sort((a, b) => Math.abs(b.deltaAmount) - Math.abs(a.deltaAmount))[0];
};

const summarizeTrend = (
  monthlySeries: AnalysisResult['trend']['monthlySeries'],
  metric: 'expense' | 'income',
  driver: MetricDriver | null,
) => {
  // 1. Kiểm tra đủ dữ liệu
  if (monthlySeries.length < 2) {
    return `Chưa có đủ dữ liệu hàng tháng để đo lường sự thay đổi ${metric === 'expense' ? 'chi tiêu' : 'thu nhập'}.`;
  }

  const previous      = monthlySeries[monthlySeries.length - 2];
  const current       = monthlySeries[monthlySeries.length - 1];
  const currentValue  = metric === 'expense' ? current.expense : current.income;
  const previousValue = metric === 'expense' ? previous.expense : previous.income;
  
  // Chuyển nhãn sang Tiếng Việt
  const metricLabel   = metric === 'expense' ? 'Chi tiêu' : 'Thu nhập';
  const metricName    = metric === 'expense' ? 'khoản chi' : 'nguồn thu';

  // 2. Xử lý trường hợp cả 2 tháng đều bằng 0
  if (previousValue <= 0 && currentValue <= 0) {
    return `Không có hoạt động ${metricName} nào được ghi nhận trong hai tháng gần đây.`;
  }

  // 3. Xử lý trường hợp tháng trước bằng 0, tháng này mới có (Tránh lỗi chia cho 0)
  if (previousValue <= 0 && currentValue > 0) {
    return `${metricLabel} đã bắt đầu phát sinh trong tháng này (tháng trước không có dữ liệu).`;
  }

  // 4. Tính % thay đổi
  const change = ((currentValue - previousValue) / previousValue) * 100;
  
  // Nếu thay đổi chưa tới 1%, coi như ổn định
  if (Math.abs(change) < 1) {
    return `Mức ${metricLabel.toLowerCase()} gần như không thay đổi so với tháng trước.`;
  }

  const movement = change > 0 ? 'tăng' : 'giảm';

  // 5. Xử lý đoạn giải thích nguyên nhân (nếu có)
  const driverPhrase = (() => {
    if (!driver) return '';

    const driverDirection = driver.deltaAmount >= 0 ? 'tăng' : 'giảm';
    const driverSubject = metric === 'expense' ? 'chi tiêu' : 'thu nhập';
    
    // Ví dụ: ", chủ yếu do chi tiêu trong mục Ăn uống tăng (+15%)"
    return `, chủ yếu do ${driverSubject} ở mục ${driver.category} đã ${driverDirection} (${formatSignedPercent(driver.changePercent)})`;
  })();

  // Kết quả cuối cùng
  return `${metricLabel} đã ${movement} ${formatPercent(change)} so với tháng trước${driverPhrase}.`;
};

const summarizeStreak = (
  monthlySeries: AnalysisResult['trend']['monthlySeries'],
  metric: 'expense' | 'income',
) => {
  if (monthlySeries.length < 3) {
    return 'Cần ít nhất ba tháng dữ liệu để xác định xu hướng liên tục.';
  }

  const metricLabel = metric === 'expense' ? 'Chi tiêu' : 'Thu nhập';
  const values      = getMetricValues(monthlySeries, metric);
  const tolerance   = getTolerance(values);

  const lastDelta = values[values.length - 1] - values[values.length - 2];
  const direction = getDirectionFromDelta(lastDelta, tolerance);

  let consecutiveMonths = 1;
  // Vòng lặp kiểm tra các tháng trước đó
  for (let i = values.length - 1; i > 0; i -= 1) {
    const delta = values[i] - values[i - 1];
    const currentDirection = getDirectionFromDelta(delta, tolerance);
    if (currentDirection !== direction) { break; }
    consecutiveMonths += 1;
  }

  if (direction === 'stable') {
    return `${metricLabel} hiện đang ổn định với rất ít biến động giữa các tháng.`;
  }

  const label = direction === 'up' ? 'tăng' : 'giảm';
  return `${metricLabel} đang có xu hướng ${label} trong ${consecutiveMonths} tháng liên tiếp.`;
};

const buildSuggestionCards = (analysis: AnalysisResult, savingsSnapshot: SavingsSnapshot): SuggestionCard[] => {
  const rateLabel = savingsSnapshot.rate === null ? null : `(~${Math.round(savingsSnapshot.rate)}% thu nhập)`;
  
  const cards = analysis.savingsPlan.map((tip) => {
    // 1. Nhóm tỷ lệ tiết kiệm THẤP
    if (/low/i.test(tip)) {
      const headline = rateLabel
        ? `Tỷ lệ tiết kiệm hiện tại của bạn đang ở mức thấp ${rateLabel}.`
        : 'Tỷ lệ tiết kiệm hiện tại của bạn đang ở mức thấp.';

      const starterAmount = savingsSnapshot.suggestedAllocation > 0
        ? Math.max(50000, Math.round(savingsSnapshot.suggestedAllocation * 0.6 / 1000) * 1000)
        : 100000;

      return {
        headline,
        action: `💡Hãy bắt đầu trích quỹ tự động khoảng ${formatMoney(starterAmount)} vào ngày nhận lương và cắt giảm 2 khoản chi không thiết yếu mỗi tuần.`,
      };
    }

    // 2. Nhóm tỷ lệ tiết kiệm TRUNG BÌNH
    if (/moderate/i.test(tip)) {
      const headline = rateLabel
        ? `Tỷ lệ tiết kiệm của bạn đang ở mức trung bình ${rateLabel}.`
        : 'Tỷ lệ tiết kiệm của bạn đang ở mức trung bình.';

      return {
        headline,
        action: '💡Hãy tăng mức trích quỹ tự động thêm 5% và thử thách bản thân với một "ngày không chi tiêu" mỗi tuần.',
      };
    }

    // 3. Nhóm tỷ lệ tiết kiệm TỐT (HEALTHY)
    if (/healthy/i.test(tip)) {
      const headline = rateLabel
        ? `Tỷ lệ tiết kiệm của bạn đang rất ổn định ${rateLabel}.`
        : 'Tỷ lệ tiết kiệm của bạn đang rất ổn định.';

      const suggestedAmount = savingsSnapshot.suggestedAllocation > 0 ? savingsSnapshot.suggestedAllocation : 100000;

      return {
        headline,
        action: `Bạn có thể dành khoảng ${formatMoney(suggestedAmount)} mỗi tháng để phân bổ vào các mục tiêu tiết kiệm dài hạn hoặc quỹ dự phòng.`,
      };
    }

    // 4. Mặc định
    return {
      headline: tip,
      action: 'Hãy biến lời khuyên này thành thói quen hàng tuần và kiểm tra lại tiến độ sau 30 ngày.',
    };
  });

  // 5. Xử lý chi tiêu bất thường (Anomaly) - Đưa lên đầu danh sách
  if (analysis.anomalies.length) {
    const categoryTotals = new Map<string, number>();
    analysis.anomalies.forEach((item) => {
      categoryTotals.set(item.category, (categoryTotals.get(item.category) || 0) + item.amount);
    });

    const [topCategory, topAmount] = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    
    // Mục tiêu tiết kiệm bằng 20% số tiền bất thường, tối thiểu 1000đ
    const monthlyTarget = Math.max(1000, Math.min(topAmount, Math.round(topAmount * 0.2)));
    const practicalAction = buildCategoryAction(topCategory);

    cards.unshift({
      headline: `Bạn đang chi tiêu cho mục ${topCategory} nhiều hơn bình thường.`,
      action: `${practicalAction.action} để tiết kiệm thêm khoảng ${formatMoney(monthlyTarget)} mỗi tháng.`,
    });
  }

  return cards.slice(0, 4); // Chỉ lấy 4 thẻ quan trọng nhất
};

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ user }) => {
  const isDark    = document.documentElement.classList.contains('dark');
  const tickColor = isDark ? '#94a3b8' : '#6b7280';
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [visibleSeries, setVisibleSeries] = useState<{ income: boolean; expense: boolean }>({
    income: true,
    expense: true,
  });
  const [aiInsights, setAiInsights] = useState<{ analysis: string; prediction: string; advice: string } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const [trendResponse, savingSuggestionResponse, anomaliesResponse, transactionResponse] = await Promise.all([
          api.get<ForcastingTrendResponse>('/analysis/forcasting-trend'),
          api.get<SavingSuggestionResponse>('/analysis/saving-suggestion'),
          api.get<DetectAnomaliesResponse>('/analysis/detect-anomalies'),
          api.get<ListTransactionResponse>('/transactions/list'),
        ]);

        const transactionData = transactionResponse.data;
        const hasAnyTransactions = transactionData.transactions.length > 0;
        setHasTransactions(hasAnyTransactions);
        setTransactions(transactionData.transactions);

        // Fetch AI Insights
        if (hasAnyTransactions) {
          api.get('/nlp/insights').then((res) => {
            setAiInsights(res.data.data);
            setLoadingInsights(false);
          }).catch((err) => {
            console.error("Failed to load AI Insights", err);
            setLoadingInsights(false);
          });
        } else {
          setLoadingInsights(false);
        }

        if (!hasAnyTransactions) {
          setAnalysis(null);
          return;
        }

        const trendData = trendResponse.data;
        const savingSuggestionData = savingSuggestionResponse.data;
        const anomaliesData = anomaliesResponse.data;

        setAnalysis({trend      : trendData.trend,
                     savingsPlan: savingSuggestionData.savingsPlan,
                     anomalies  : anomaliesData.anomalies,});
      } catch (fetchError) {
        console.error(fetchError);
        setHasTransactions(null);
      }
    };

    loadTransactions();
  }, [user.token]);

  const fallbackAnalysis: AnalysisResult = useMemo(() => ({
    trend: {
      monthlySeries: [],
      predictedNextMonthIncome: 0,
      predictedNextMonthExpense: 0,
      expenseTrend: 'stable',
    },
    savingsPlan: ['Không đủ dữ liệu để đưa ra kế hoạch tiết kiệm. Hãy thêm giao dịch để nhận được những lời khuyên cá nhân hóa!'],
    anomalies: [],
  }), []);

  const effectiveAnalysis   = analysis || fallbackAnalysis;
  const recentMonthlySeries = useMemo(() => effectiveAnalysis.trend.monthlySeries.slice(-12),
                                            [effectiveAnalysis.trend.monthlySeries],);

  const expenseTrendDirection = useMemo(() => getTrendDirection(recentMonthlySeries, 'expense'),
                                              [recentMonthlySeries],);

  const incomeTrendDirection = useMemo(() => getTrendDirection(recentMonthlySeries, 'income'),
                                             [recentMonthlySeries],);

  const expenseDriver = useMemo(() => getMainDriver(transactions, 'expense'), [transactions]);
  const incomeDriver = useMemo(() => getMainDriver(transactions, 'income'), [transactions]);
  const savingsSnapshot = useMemo(() => getSavingsSnapshot(recentMonthlySeries), [recentMonthlySeries]);

  const expenseNarratives = useMemo(() => {return [summarizeTrend(recentMonthlySeries, 'expense', expenseDriver),
                                                   summarizeStreak(recentMonthlySeries, 'expense'),];}, 
                                          [recentMonthlySeries, expenseDriver]);

  const incomeNarratives = useMemo(() => {return [summarizeTrend(recentMonthlySeries, 'income', incomeDriver),
                                                  summarizeStreak(recentMonthlySeries, 'income'),];}, 
                                         [recentMonthlySeries, incomeDriver]);

  const suggestionCards = useMemo(() => buildSuggestionCards(effectiveAnalysis, savingsSnapshot),
                                  [effectiveAnalysis, savingsSnapshot],);

  const expenseCategoryDistribution = useMemo(() => {
    const categoryTotals = new Map<string, number>();

    transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        item.details.forEach((detail) => {
          const current = categoryTotals.get(detail.categoryName) || 0;
          categoryTotals.set(detail.categoryName, current + detail.amount);
        });
      });

    const totalExpense = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);

    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const categoryBarChartHeight = useMemo(
    () => Math.max(260, expenseCategoryDistribution.length * 40),
    [expenseCategoryDistribution.length],
  );

  const toggleTrendSeries = (series: 'income' | 'expense') => {
    setVisibleSeries((previous) => ({
      ...previous,
      [series]: !previous[series],
    }));
  };

  const handleLegendClick = (entry: unknown) => {
    const payload = entry as { dataKey?: unknown } | null | undefined;
    const dataKey = payload?.dataKey;
    if (dataKey === 'income' || dataKey === 'expense') {
      toggleTrendSeries(dataKey);
    }
  };

  const renderLegendText = (value: string | number, entry: unknown) => {
    const payload = entry as { dataKey?: unknown } | null | undefined;
    const dataKey = payload?.dataKey;
    const isVisible = dataKey === 'income' || dataKey === 'expense' ? visibleSeries[dataKey] : true;

    return (
      <span className={isVisible ? 'text-gray-700' : 'text-gray-400'}>
        {String(value)}
      </span>
    );
  };

  if (hasTransactions === false) {
    return (
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Phân tích</h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700 font-medium">Hiện chưa có dữ liệu nào để phân tích.</p>
            <p className="text-xs text-gray-500 mt-1">Thêm ít nhất một giao dịch để tạo ra những hiểu biết và đề xuất về xu hướng.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6 transition-colors">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Phân tích chuyên sâu</h2>

      {/* AI Insights Section */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 dark:from-indigo-900/30 to-purple-50 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800 shadow-sm transition-colors">
        <h3 className="text-md font-bold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Góc nhìn AI
        </h3>
        {loadingInsights ? (
          <p className="text-sm text-indigo-600 animate-pulse">AI đang phân tích dữ liệu của bạn...</p>
        ) : aiInsights ? (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-50 dark:border-indigo-900/50">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">Đánh giá chung</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiInsights.analysis}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-50 dark:border-indigo-900/50">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block mb-1">Dự đoán tháng tới</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiInsights.prediction}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-50 dark:border-indigo-900/50">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">Lời khuyên tiết kiệm</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiInsights.advice}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chưa có đủ dữ liệu để AI phân tích.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Xu hướng chi tiêu</p>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{trendLabel[expenseTrendDirection]}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Xu hướng thu nhập</p>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{trendLabel[incomeTrendDirection]}</p>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Phân tích xu hướng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Thông tin chi tiết về chi phí</p>
            {expenseNarratives.map((line, index) => (
              <p key={`${line}-${index}`} className="text-xs text-red-900 dark:text-red-200">
                • {line}
              </p>
            ))}
          </div>
          <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Thông tin chi tiết về thu nhập</p>
            {incomeNarratives.map((line, index) => (
              <p key={`${line}-${index}`} className="text-xs text-emerald-900 dark:text-emerald-200">
                • {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <Charts transactions={transactions} />

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Đề xuất tiết kiệm</h3>
        <div className="space-y-2">
          {suggestionCards.map((card, index) => (
            <div key={`${card.headline}-${index}`} className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 p-3">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">{card.headline}</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">{card.action}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Chi tiêu bất thường</h3>
        {effectiveAnalysis.anomalies.length ? (
          <div className="space-y-2">
            {effectiveAnalysis.anomalies.slice(0, 5).map((item) => (
              <div key={item._id} className="rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-xs font-medium text-red-700 dark:text-red-400">{item.description} - {formatMoney(item.amount)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.date} | {item.category}</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 p-3">
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Không phát hiện khoản chi tiêu bất thường nào.</p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">Thói quen chi tiêu của bạn nhất quán và dễ dự đoán.</p>
          </div>
        )}
      </div>
      </div>
    </section>
  );
};

export default AnalysisPage;
