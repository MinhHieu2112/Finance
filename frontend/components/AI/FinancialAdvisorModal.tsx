import React from 'react';
import { Button } from '../Button';
import { Plus, Sparkles } from 'lucide-react';

interface FinancialAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  advice: string | null;
}

export const FinancialAdvisorModal: React.FC<FinancialAdvisorModalProps> = ({ isOpen, onClose, loading, advice }) => {
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

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-500 animate-pulse">Đang phân tích thói quen chi tiêu...</p>
            </div>
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
