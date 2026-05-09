import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';
import type {
  AnalysisPageProps,
  AnalysisResult,
  DetectAnomaliesResponse,
  ForecastingTrendResponse,
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
import { Sparkles, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, ShieldCheck, Zap, LayoutDashboard, LineChart as LineChartIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { Charts } from '../../components/Charts/Charts';

const trendLabel: Record<'up' | 'down' | 'stable', string> = {up: 'Tăng',
                                                              down: 'Giảm',
                                                              stable: 'Ổn định',};
// Làm tròn số
const formatMoney   = (value: number) => formatCurrency(value, Currency.VND);
const formatPercent = (value: number) => `${Math.abs(value).toFixed(0)}%`;
const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;

// Xử lý dữ liệu trend
// Trích xuất chuỗi giá trị (chi tiêu hoặc thu nhập) từ chuỗi dữ liệu hàng tháng.
const getMetricValues = (
  monthlySeries: AnalysisResult['trend']['monthlySeries'],
  metric: 'expense' | 'income',
) => monthlySeries.map((point) => (metric === 'expense' ? point.expense : point.income));

// Tính toán ngưỡng biến động (tolerance) dựa trên trung vị của các giá trị dữ liệu.
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
// Xác định hướng xu hướng của một chỉ số tài chính dựa trên dữ liệu hàng tháng.
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

// Tính toán tỷ lệ tiết kiệm và đề xuất phân bổ ngân sách dựa trên dữ liệu hiện tại.
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

// Tìm ra danh mục đóng góp lớn nhất vào sự thay đổi (tăng/giảm) của một chỉ số tài chính.
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
      const amount = detail.base_amount || detail.amount;
      detailTotals.set(detail.categoryName, (detailTotals.get(detail.categoryName) || 0) + (amount * (detail.quantity || 1)));
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

// Tạo chuỗi mô tả tổng hợp về xu hướng biến động hàng tháng.
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

// Xác định và mô tả chuỗi tăng/giảm liên tục của một chỉ số tài chính.
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

// Xây dựng danh sách các thẻ gợi ý tiết kiệm dựa trên kết quả phân tích và tình trạng hiện tại.
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

const formatDate = (dateVal: string | Date) => {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
          api.get<ForecastingTrendResponse>('/analysis/forecasting-trend'),
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
            toast.error("Không thể tải phân tích thông minh từ AI.");
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
        toast.error('Lỗi khi tải dữ liệu phân tích. Vui lòng thử lại sau.');
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
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Phân tích chuyên sâu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Báo cáo tài chính chi tiết được hỗ trợ bởi trí tuệ nhân tạo</p>
        </div>
      </div>

      {/* AI Insights Section - Premium Glow Design */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#1a1c26] border border-indigo-50 dark:border-[#2a2d3d] p-8 md:p-12 shadow-2xl shadow-indigo-500/5 transition-all group">
        {/* Animated background glows */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full group-hover:bg-indigo-500/15 transition-colors duration-1000"></div>
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full group-hover:bg-purple-500/15 transition-colors duration-1000"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 ring-8 ring-indigo-50 dark:ring-indigo-900/10">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Góc nhìn AI thông minh</h3>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase font-black tracking-[0.25em]">SECURE AI ANALYSIS • GOOGLE GEMINI</p>
              </div>
            </div>
          </div>

          {loadingInsights ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-base text-slate-600 dark:text-slate-400 font-semibold animate-pulse tracking-wide">Đang phân tích cấu trúc tài chính của bạn...</p>
            </div>
          ) : aiInsights ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { title: 'Đánh giá tổng quát', content: aiInsights.analysis, color: 'indigo', icon: <LayoutDashboard className="w-5 h-5" /> },
                { title: 'Dự báo xu hướng', content: aiInsights.prediction, color: 'purple', icon: <TrendingUpIcon className="w-5 h-5" /> },
                { title: 'Chiến lược tối ưu', content: aiInsights.advice, color: 'emerald', icon: <Zap className="w-5 h-5" /> }
              ].map((item, idx) => (
                <div key={idx} className="group/card bg-gray-50/50 dark:bg-[#13151f]/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 dark:border-[#2a2d3d] hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-2xl hover:-translate-y-1">
                   <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400 group-hover/card:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className={`text-xs font-black text-${item.color}-600 dark:text-${item.color}-400 uppercase tracking-[0.1em]`}>
                      {item.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50/50 dark:bg-[#13151f]/30 backdrop-blur-md p-12 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-slate-500 font-medium">Hệ thống cần thêm dữ liệu để khởi tạo phân tích chuyên sâu.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Left Column: Trends */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <LineChartIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Phân tích xu hướng</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Expense Trend Card */}
            <div className="relative group overflow-hidden rounded-3xl border border-red-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-7 shadow-sm transition-all hover:border-red-200 dark:hover:border-red-500/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-red-500/10 transition-colors"></div>
              <div className="relative z-10">
                <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.15em] mb-2">Chi tiêu</p>
                <div className="flex items-center gap-3 mb-6">
                  <h4 className={`text-3xl font-black ${expenseTrendDirection === 'up' ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    {trendLabel[expenseTrendDirection]}
                  </h4>
                  {expenseTrendDirection === 'up' ? <TrendingUpIcon className="text-red-500" /> : <TrendingDownIcon className="text-emerald-500" />}
                </div>
                <div className="space-y-3.5 pt-5 border-t border-red-50 dark:border-slate-800">
                  {expenseNarratives.map((line, i) => (
                    <div key={i} className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 mt-1.5 shrink-0"></div>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Income Trend Card */}
            <div className="relative group overflow-hidden rounded-3xl border border-emerald-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-7 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-500/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="relative z-10">
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.15em] mb-2">Thu nhập</p>
                <div className="flex items-center gap-3 mb-6">
                  <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                    {trendLabel[incomeTrendDirection]}
                  </h4>
                  <TrendingUpIcon className="text-emerald-500" />
                </div>
                <div className="space-y-3.5 pt-5 border-t border-emerald-50 dark:border-slate-800">
                  {incomeNarratives.map((line, i) => (
                    <div key={i} className="flex gap-3 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 mt-1.5 shrink-0"></div>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Anomalies */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Phát hiện bất thường</h3>
            </div>
            {effectiveAnalysis.anomalies.length > 0 && (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                {effectiveAnalysis.anomalies.length} Cảnh báo
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {effectiveAnalysis.anomalies.length > 0 ? (
              effectiveAnalysis.anomalies.slice(0, 4).map((item, index) => (
                <div key={item._id || index} className="group relative overflow-hidden rounded-3xl border border-slate-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-6 shadow-sm hover:shadow-xl transition-all">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                   <div className="flex justify-between items-start gap-4 mb-4">
                     <div className="flex-1">
                       <p className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-red-600 transition-colors">{item.description}</p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                        {formatDate(item.date)} • <span className="text-slate-500 dark:text-slate-400">{item.category}</span>
                       </p>
                     </div>
                     <div className="text-right">
                       <span className="text-xl font-black text-slate-900 dark:text-white">{formatMoney(item.amount)}</span>
                     </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-red-50/40 dark:bg-red-900/10 text-xs text-red-800 dark:text-red-300 border border-red-100/50 dark:border-red-900/20 leading-relaxed font-medium italic">
                     <span className="not-italic font-black text-red-600 dark:text-red-400 mr-2 uppercase tracking-tighter">AI LOG:</span>
                     "{item.reason}"
                   </div>
                </div>
              ))
            ) : (
              <div className="rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-[#2a2d3d] p-16 text-center bg-gray-50/30 dark:bg-transparent">
                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-2xl shadow-emerald-500/10">
                  <ShieldCheck size={40} />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">Hệ thống an toàn</p>
                <p className="text-sm text-slate-500 mt-2 max-w-[240px] mx-auto leading-relaxed">Không phát hiện hành vi chi tiêu lệch chuẩn nào trong giai đoạn này.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <LineChartIcon size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Biểu đồ tài chính</h3>
        </div>
        <Charts transactions={transactions} />
      </div>

      {/* Saving Suggestions - Interactive Cards */}
      <div className="space-y-8 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Zap size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chiến lược đề xuất từ AI</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {suggestionCards.map((card, index) => (
            <div key={index} className="group relative overflow-hidden rounded-[2rem] border border-slate-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-8 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 cursor-default">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/15 transition-colors"></div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                <Zap size={28} />
              </div>
              <h5 className="text-base font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight group-hover:text-emerald-600 transition-colors">
                {card.headline}
              </h5>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
                "{card.action}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
