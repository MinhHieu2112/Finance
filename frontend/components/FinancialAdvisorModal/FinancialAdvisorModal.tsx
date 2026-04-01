import React, { useMemo, useState } from 'react';
import { Button } from '../Button/Button';
import { Plus, Sparkles } from 'lucide-react';
import { AnalysisResult } from '../../types';

interface FinancialAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  advice: string | null;
  analysis: AnalysisResult | null;
}

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`;

const trendLabel: Record<'up' | 'down' | 'stable', string> = {
  up: 'Tăng',
  down: 'Giảm',
  stable: 'Ổn định',
};

export const FinancialAdvisorModal: React.FC<FinancialAdvisorModalProps> = ({
  isOpen,
  onClose,
  loading,
  advice,
  analysis,
}) => {
  const [activeTab, setActiveTab] = useState<'advice' | 'analysis'>('analysis');

  const hasAnalysis = useMemo(() => {
    return Boolean(analysis && (analysis.trend.monthlySeries.length || analysis.savingsPlan.length || analysis.anomalies.length));
  }, [analysis]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <Plus size={24} className="rotate-45" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 p-2 rounded-full">
            <Sparkles className="text-purple-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Góc nhìn tài chính</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === 'analysis'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advice')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === 'advice'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tóm tắt
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-500 animate-pulse">Đang phân tích thói quen chi tiêu...</p>
            </div>
          ) : activeTab === 'analysis' ? (
            hasAnalysis && analysis ? (
              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs text-gray-500 uppercase">Xu hướng chi</p>
                    <p className="font-semibold text-gray-800">{trendLabel[analysis.trend.expenseTrend]}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs text-gray-500 uppercase">Dự đoán thu tháng tới</p>
                    <p className="font-semibold text-emerald-700">{formatMoney(analysis.trend.predictedNextMonthIncome)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs text-gray-500 uppercase">Dự đoán chi tháng tới</p>
                    <p className="font-semibold text-red-600">{formatMoney(analysis.trend.predictedNextMonthExpense)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Xu hướng theo tháng</h3>
                  <div className="space-y-1">
                    {analysis.trend.monthlySeries.length ? (
                      analysis.trend.monthlySeries.map((item) => (
                        <div key={item.month} className="flex justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-gray-600">{item.month}</span>
                          <span className="text-gray-700">Thu {formatMoney(item.income)} | Chi {formatMoney(item.expense)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Chưa đủ dữ liệu theo tháng.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Gợi ý tiết kiệm/cắt giảm</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {analysis.savingsPlan.map((tip, index) => (
                      <li key={`${tip}-${index}`}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Chi tiêu bất thường</h3>
                  {analysis.anomalies.length ? (
                    <div className="space-y-2">
                      {analysis.anomalies.map((item) => (
                        <div key={item.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                          <p className="font-medium text-red-700">{item.description} - {formatMoney(item.amount)}</p>
                          <p className="text-xs text-gray-600">{item.date} | {item.category}</p>
                          <p className="text-xs text-gray-700 mt-1">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Chưa phát hiện giao dịch bất thường rõ ràng.</p>
                  )}
                </div>
              </div>
            ) : (
              <p>Không có dữ liệu analysis. Vui lòng thử lại sau khi thêm giao dịch.</p>
            )
          ) : (
            <div className="prose prose-sm">
              {advice ? <div className="whitespace-pre-line">{advice}</div> : <p>Không thể tạo lời khuyên. Vui lòng thử lại.</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
