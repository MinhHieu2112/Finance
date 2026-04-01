import React, { useEffect, useMemo, useState } from 'react';
import { AnalysisResult } from '../../types/Analysis';
import { Transaction } from '../../types/Transactions';
import { User } from '../../types/Users';
import { ResponsiveContainer,
         LineChart,
         Line,
         CartesianGrid,
         XAxis,
         YAxis,
         Tooltip,
         Legend,} from 'recharts';

interface AnalysisPageProps {
  user: User;
}

interface ForcastingTrendResponse {
  success: boolean;
  trend: AnalysisResult['trend'];
}

interface SavingSuggestionResponse {
  success: boolean;
  savingsPlan: string[];
}

interface DetectAnomaliesResponse {
  success: boolean;
  anomalies: AnalysisResult['anomalies'];
}

interface ListTransactionResponse {
  success: boolean;
  transactions: Transaction[];
}

const API_BASE_URL = 'http://localhost:4000/api';

const trendLabel: Record<'up' | 'down' | 'stable', string> = {up: 'Up',
                                                              down: 'Down',
                                                              stable: 'Stable',};

const formatMoney   = (value: number) => `${Math.round(value).toLocaleString('en-US')} VND`;
const formatPercent = (value: number) => `${Math.abs(value).toFixed(0)}%`;
const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;

type TrendDirection = 'up' | 'down' | 'stable';

interface MetricDriver {
  category: string;
  changePercent: number;
  deltaAmount: number;
}

interface SavingsSnapshot {
  rate: number | null;
  monthlySurplus: number;
  suggestedAllocation: number;
}

interface SuggestionCard {
  headline: string;
  action: string;
}

const getMetricValues = (
  monthlySeries: AnalysisResult['trend']['monthlySeries'],
  metric: 'expense' | 'income',
) => monthlySeries.map((point) => (metric === 'expense' ? point.expense : point.income));

const getTolerance = (values: number[]) => {
  const absoluteValues = values.map((amount) => Math.abs(amount)).filter((amount) => amount > 0);

  if (absoluteValues.length === 0) {
    return 20;
  }

  const sortedValues = [...absoluteValues].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];

  return Math.max(20, median * 0.03);
};

const getDirectionFromDelta = (delta: number, tolerance: number): TrendDirection => {
  if (delta > tolerance) {
    return 'up';
  }

  if (delta < -tolerance) {
    return 'down';
  }

  return 'stable';
};

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
  'food & dining': { unit   : 'meals out',               
                     action : 'Reduce 2 meals out per week' },
  food:            { unit   : 'meals out',               
                     action : 'Reduce 2 meals out per week' },
  dining:          { unit   : 'meals out',               
                     action : 'Reduce 2 meals out per week' },
  groceries:       { unit   : 'shopping trips',          
                     action : 'Skip 1 impulse grocery run per week' },
  transport:       { unit   : 'ride-hailing trips',      
                     action : 'Replace 2 ride-hailing trips per week with public transit' },
  transportation:  { unit   : 'ride-hailing trips',      
                     action : 'Replace 2 ride-hailing trips per week with public transit' },
  shopping:        { unit   : 'non-essential purchases', 
                     action : 'Cut 2 non-essential purchases per week' },
  entertainment:   { unit   : 'paid activities',         
                     action : 'Swap 1 paid activity per week for a free option' },
};

const buildCategoryAction = (category: string) => {
    const normalizedCategory = category.trim().toLowerCase();
    return categoryActionMap[normalizedCategory] || {unit: 'non-essential purchases',
                                                   action: `Cut 2 ${category} purchases per week`,};};

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
    if (monthKey === previousMonth) {
      previousTotals.set(item.category, (previousTotals.get(item.category) || 0) + item.amount);
    }

    if (monthKey === currentMonth) {
      currentTotals.set(item.category, (currentTotals.get(item.category) || 0) + item.amount);
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

const summarizeTrend = (monthlySeries: AnalysisResult['trend']['monthlySeries'],
                        metric: 'expense' | 'income',
                        driver: MetricDriver | null,) => {
  if (monthlySeries.length < 2) {
    return `Not enough monthly data yet to measure month-over-month ${metric} change.`;
  }

  const previous      = monthlySeries[monthlySeries.length - 2];
  const current       = monthlySeries[monthlySeries.length - 1];
  const currentValue  = metric === 'expense' ? current.expense : current.income;
  const previousValue = metric === 'expense' ? previous.expense : previous.income;
  const metricLabel   = metric === 'expense' ? 'Expenses' : 'Income';

  if (previousValue <= 0 && currentValue <= 0) {
    return `No ${metric} activity was recorded in the latest two months.`;
  }

  if (previousValue <= 0 && currentValue > 0) {
    return `${metricLabel} activity appeared this month after a zero-${metric} month.`;
  }

  const change = ((currentValue - previousValue) / previousValue) * 100;
  if (Math.abs(change) < 1) {
    return `${metricLabel} were almost unchanged compared with last month.`;
  }

  const movement = change > 0 ? 'increased' : 'decreased';

  const driverPhrase = (() => {
    if (!driver) {
      return '';
    }

    const driverDirection = driver.deltaAmount >= 0 ? 'higher' : 'lower';
    const driverSubject = metric === 'expense' ? 'spending' : 'income';
    return `, mainly driven by ${driverDirection} ${driverSubject} in ${driver.category} (${formatSignedPercent(driver.changePercent)}).`;
  })();

  return `${metricLabel} ${movement} by ${formatPercent(change)} compared with last month${driverPhrase}`;
};

const summarizeStreak = (monthlySeries: AnalysisResult['trend']['monthlySeries'],
                         metric: 'expense' | 'income',) => {
    if (monthlySeries.length < 3) {
      return 'At least three months are needed to identify a continuous direction.';
    }

    const metricLabel = metric === 'expense' ? 'Expenses' : 'Income';
    const values      = getMetricValues(monthlySeries, metric);
    const tolerance   = getTolerance(values);

    const lastDelta = values[values.length - 1] - values[values.length - 2];
    const direction = getDirectionFromDelta(lastDelta, tolerance);

    let consecutiveMonths = 1;
    for (let i = values.length - 1; i > 0; i -= 1) {
      const delta = values[i] - values[i - 1];
      const currentDirection = getDirectionFromDelta(delta, tolerance);
      if (currentDirection !== direction) { break; }
      consecutiveMonths += 1;
    }

    if (direction === 'stable') {
      return `${metricLabel} are currently stable with only minor month-to-month changes.`;
    }

    const label = direction === 'up' ? 'upward' : 'downward';
    return `${metricLabel} show a ${label} direction for ${consecutiveMonths} consecutive months.`;
};

const buildSuggestionCards = (analysis: AnalysisResult, savingsSnapshot: SavingsSnapshot): SuggestionCard[] => {
  const rateLabel = savingsSnapshot.rate === null ? null : `(~${Math.round(savingsSnapshot.rate)}% of income)`;
  const cards = analysis.savingsPlan.map((tip) => {
    if (/low/i.test(tip)) {
      const headline = rateLabel
        ? `Your savings rate is currently low ${rateLabel}.`
        : 'Your savings rate is currently low.';

      const starterAmount = savingsSnapshot.suggestedAllocation > 0
        ? Math.max(50000, Math.round(savingsSnapshot.suggestedAllocation * 0.6 / 1000) * 1000)
        : 100000;

      return {
        headline,
        action: `💡Start with an automatic transfer of about ${formatMoney(starterAmount)} on payday and cut 2 flexible purchases per week.`,
      };
    }

    if (/moderate/i.test(tip)) {
      const headline = rateLabel
        ? `Your savings rate is moderate ${rateLabel}.`
        : 'Your savings rate is moderate.';

      return {
        headline,
        action: '💡Increase your automatic transfer by 5% and commit to one no-spend day each week.',
      };
    }

    if (/healthy/i.test(tip)) {
      const headline = rateLabel
        ? `Your savings rate is healthy ${rateLabel}.`
        : 'Your savings rate is healthy.';

      const suggestedAmount = savingsSnapshot.suggestedAllocation > 0 ? savingsSnapshot.suggestedAllocation : 100000;

      return {
        headline,
        action: `💡You could allocate about ${formatMoney(suggestedAmount)} per month to a low-risk savings goal.`,
      };
    }

    // const cutMatch = tip.match(/cut at least\s+([\d,]+)\s+VND/i);
    // if (cutMatch) {
    //   return {
    //     headline: 'Flexible spending is higher than necessary.',
    //     action: `💡Reduce 2 non-essential purchases per week to save around ${cutMatch[1]} VND per month.`,
    //   };
    // }

    return {
      headline: tip,
      action: '💡Turn this into one weekly habit and review progress after 30 days.',
    };
  });

  if (analysis.anomalies.length) {
    const categoryTotals = new Map<string, number>();
    analysis.anomalies.forEach((item) => {
      categoryTotals.set(item.category, (categoryTotals.get(item.category) || 0) + item.amount);
    });

    const [topCategory, topAmount] = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    const monthlyTarget = Math.max(1000, Math.min(topAmount, Math.round(topAmount * 0.2)));
    const practicalAction = buildCategoryAction(topCategory);

    cards.unshift({
      headline: `You are spending more than usual on ${topCategory}.`,
      action: `💡${practicalAction.action} to save about ${formatMoney(monthlyTarget)} per month.`,
    });
  }

  return cards.slice(0, 4);
};

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ user }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [visibleSeries, setVisibleSeries] = useState<{ income: boolean; expense: boolean }>({
    income: true,
    expense: true,
  });

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const [trendResponse, savingSuggestionResponse, anomaliesResponse, transactionResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/analysis/forcasting-trend`, {
            headers: {Authorization: `Bearer ${user.token}`},
          }),

          fetch(`${API_BASE_URL}/analysis/saving-suggestion`, {
            headers: {Authorization: `Bearer ${user.token}`},
          }),

          fetch(`${API_BASE_URL}/analysis/detect-anomalies`, {
            headers: {Authorization: `Bearer ${user.token}`},
          }),

          fetch(`${API_BASE_URL}/transactions/list`, {
            headers: {Authorization: `Bearer ${user.token}`},
          }),
        ]);

        if (!trendResponse.ok || !savingSuggestionResponse.ok || !anomaliesResponse.ok || !transactionResponse.ok) {
          throw new Error('Cannot load analysis data');
        }

        const transactionData: ListTransactionResponse = await transactionResponse.json();
        const hasAnyTransactions = transactionData.transactions.length > 0;
        setHasTransactions(hasAnyTransactions);
        setTransactions(transactionData.transactions);

        if (!hasAnyTransactions) {
          setAnalysis(null);
          return;
        }

        const trendData: ForcastingTrendResponse             = await trendResponse.json();
        const savingSuggestionData: SavingSuggestionResponse = await savingSuggestionResponse.json();
        const anomaliesData: DetectAnomaliesResponse         = await anomaliesResponse.json();

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
    savingsPlan: ['No data available yet. Add more transactions to get personalized suggestions.'],
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

  const toggleTrendSeries = (series: 'income' | 'expense') => {
    setVisibleSeries((previous) => ({
      ...previous,
      [series]: !previous[series],
    }));
  };

  const handleLegendClick = (entry: { dataKey?: string }) => {
    const dataKey = entry?.dataKey;
    if (dataKey === 'income' || dataKey === 'expense') {
      toggleTrendSeries(dataKey);
    }
  };

  const renderLegendText = (value: string, entry: { dataKey?: string }) => {
    const dataKey = entry?.dataKey;
    const isVisible = dataKey === 'income' || dataKey === 'expense' ? visibleSeries[dataKey] : true;

    return (
      <span className={isVisible ? 'text-gray-700' : 'text-gray-400'}>
        {value}
      </span>
    );
  };

  if (hasTransactions === false) {
    return (
      <section className="p-6 md:p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis</h2>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700 font-medium">No data available for analysis yet.</p>
            <p className="text-xs text-gray-500 mt-1">Add at least one transaction to generate trend insights and suggestions.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs text-gray-500 uppercase">Expense Trend</p>
          <p className="text-sm font-semibold text-red-700">{trendLabel[expenseTrendDirection]}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs text-gray-500 uppercase">Income Trend</p>
          <p className="text-sm font-semibold text-emerald-700">{trendLabel[incomeTrendDirection]}</p>
        </div>
        {/* <div className="rounded-lg border border-gray-200 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700 uppercase">Predicted Next Month Income</p>
          <p className="text-sm font-semibold text-emerald-800">{formatMoney(effectiveAnalysis.trend.predictedNextMonthIncome)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-red-50 p-3">
          <p className="text-xs text-red-700 uppercase">Predicted Next Month Expense</p>
          <p className="text-sm font-semibold text-red-800">{formatMoney(effectiveAnalysis.trend.predictedNextMonthExpense)}</p>
        </div> */}
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Trend Narrative</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-red-700 uppercase">Expense Insights</p>
            {expenseNarratives.map((line, index) => (
              <p key={`${line}-${index}`} className="text-xs text-red-900">
                • {line}
              </p>
            ))}
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Income Insights</p>
            {incomeNarratives.map((line, index) => (
              <p key={`${line}-${index}`} className="text-xs text-emerald-900">
                • {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Monthly Trend (Last 12 Months)</h3>
        <div className="h-72 rounded-lg border border-gray-200 bg-white p-2">
          {recentMonthlySeries.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentMonthlySeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Legend onClick={handleLegendClick} formatter={renderLegendText} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2.5} hide={!visibleSeries.income} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" strokeWidth={2.5} hide={!visibleSeries.expense} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-500 p-3">Not enough monthly data yet.</p>
          )}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Saving Suggestions</h3>
        <div className="space-y-2">
          {suggestionCards.map((card, index) => (
            <div key={`${card.headline}-${index}`} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">{card.headline}</p>
              <p className="text-xs text-amber-800 mt-1">{card.action}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Anomalies</h3>
        {effectiveAnalysis.anomalies.length ? (
          <div className="space-y-2">
            {effectiveAnalysis.anomalies.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">{item.description} - {formatMoney(item.amount)}</p>
                <p className="text-xs text-gray-600">{item.date} | {item.category}</p>
                <p className="text-xs text-gray-700 mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-900">No unusual spending detected.</p>
            <p className="text-xs text-emerald-800 mt-1">Your spending pattern is consistent and predictable.</p>
          </div>
        )}
      </div>
      </div>
    </section>
  );
};

export default AnalysisPage;
