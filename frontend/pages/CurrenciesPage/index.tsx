import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Coins, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { Button } from '../../components/Button/Button';

interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  rateToVnd: number;
}

interface CurrenciesPageProps {
  user: { token: string };
}

// Component quản lý danh sách tiền tệ và tỷ giá quy đổi sang VND.
export const CurrenciesPage: React.FC<CurrenciesPageProps> = ({ user }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho việc thêm mới
  const [isAdding, setIsAdding] = useState(false);
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    rateToVnd: 0
  });

  // State cho việc chỉnh sửa
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPayload, setEditPayload] = useState<Partial<Currency>>({});
  
  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  /**
   * Tải danh sách tiền tệ từ API khi trang được tải.
   */
  const loadCurrencies = async () => {
    try {
      const response = await api.get<{ success: boolean; currencies: Currency[] }>('/currencies/list');
      setCurrencies(response.data.currencies);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách tiền tệ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  /**
   * Xử lý thêm tiền tệ mới.
   */
  const handleAdd = async () => {
    if (!newCurrency.code || !newCurrency.name || newCurrency.rateToVnd <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }

    try {
      await api.post('/currencies/add', newCurrency);
      toast.success('Thêm tiền tệ thành công');
      setIsAdding(false);
      setNewCurrency({ code: '', name: '', symbol: '', rateToVnd: 0 });
      loadCurrencies();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi thêm tiền tệ'));
    }
  };

  /**
   * Xử lý xóa tiền tệ.
   */
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/currencies/delete/${id}`);
      toast.success('Đã xóa tiền tệ');
      loadCurrencies();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi xóa tiền tệ'));
    }
  };

  /**
   * Bắt đầu chế độ chỉnh sửa.
   */
  // Kích hoạt chế độ chỉnh sửa cho một loại tiền tệ cụ thể.
  const startEdit = (currency: Currency) => {
    setEditingId(currency._id);
    setEditPayload(currency);
  };

  /**
   * Lưu thay đổi sau khi chỉnh sửa.
   */
  const handleEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/currencies/edit/${editingId}`, editPayload);
      toast.success('Cập nhật thành công');
      setEditingId(null);
      loadCurrencies();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Lỗi khi cập nhật'));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Introduction */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Quản lý tiền tệ
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Thiết lập tỷ giá quy đổi ngoại tệ sang VND để báo cáo tài chính chính xác hơn.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="rounded-2xl px-6 py-3 shadow-lg shadow-indigo-600/20">
          <Plus size={20} />
          Thêm tiền tệ
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-indigo-900/50 rounded-xl text-indigo-600 shadow-sm">
          <Info size={20} />
        </div>
        <div className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
          <p>Hệ thống sử dụng VND làm đơn vị tiền tệ gốc. Các giá trị bạn nhập ở đây sẽ được dùng để quy đổi các giao dịch ngoại tệ về VND trong các báo cáo phân tích.</p>
        </div>
      </div>

      {/* Adding Form Inline */}
      {isAdding && (
        <div className="bg-white dark:bg-[#1a1c26] p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mã (USD, EUR...)</label>
              <input 
                type="text" 
                value={newCurrency.code} 
                onChange={e => setNewCurrency({...newCurrency, code: e.target.value})}
                placeholder="Ví dụ: USD"
                className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên hiển thị</label>
              <input 
                type="text" 
                value={newCurrency.name} 
                onChange={e => setNewCurrency({...newCurrency, name: e.target.value})}
                placeholder="Ví dụ: Đô la Mỹ"
                className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tỷ giá sang VND</label>
              <input 
                type="text" 
                value={newCurrency.rateToVnd === 0 ? '' : newCurrency.rateToVnd.toLocaleString('vi-VN')} 
                onChange={e => {
                  // Loại bỏ tất cả ký tự không phải số
                  const val = e.target.value.replace(/[^\d]/g, '');
                  setNewCurrency({...newCurrency, rateToVnd: Number(val)});
                }}
                placeholder="Ví dụ: 25400"
                className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <p className="text-[9px] text-slate-400 italic mt-1">Hệ thống tự động xử lý dấu chấm/phẩy (Ví dụ: 26.308 sẽ là 26308)</p>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAdd} className="flex-1 rounded-xl h-11">Lưu</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl h-11 w-11 p-0">
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Currencies Table */}
      <div className="bg-white dark:bg-[#1a1c26] rounded-none border border-gray-100 dark:border-[#2a2d3d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#13151f]/50 border-b border-gray-100 dark:border-[#2a2d3d]">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiền tệ</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỷ giá (1 ĐV = ? VND)</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2a2d3d]">
              {currencies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(currency => (
                <tr key={currency._id} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-colors">
                  <td className="px-8 py-6">
                    {editingId === currency._id ? (
                      <div className="flex gap-4">
                        <input 
                          className="bg-white dark:bg-[#0f111a] border border-indigo-200 p-2 rounded-lg text-sm w-24"
                          value={editPayload.code} 
                          onChange={e => setEditPayload({...editPayload, code: e.target.value})}
                        />
                        <input 
                          className="bg-white dark:bg-[#0f111a] border border-indigo-200 p-2 rounded-lg text-sm"
                          value={editPayload.name} 
                          onChange={e => setEditPayload({...editPayload, name: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-lg font-black text-indigo-600">
                          {currency.symbol || currency.code[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase text-sm">{currency.code}</p>
                          <p className="text-xs text-slate-500 font-medium">{currency.name}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {editingId === currency._id ? (
                      <input 
                        type="text"
                        className="bg-white dark:bg-[#0f111a] border border-indigo-200 p-2 rounded-lg text-sm"
                        value={editPayload.rateToVnd?.toLocaleString('vi-VN') || ''} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^\d]/g, '');
                          setEditPayload({...editPayload, rateToVnd: Number(val)});
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                        <ArrowRightLeft size={16} className="text-slate-300" />
                        {currency.rateToVnd.toLocaleString()} VND
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {editingId === currency._id ? (
                      <div className="flex justify-end gap-2">
                          <button onClick={handleEdit} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"><Check size={20} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(currency)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(currency._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {currencies.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Coins size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-medium">Bạn chưa thiết lập loại ngoại tệ nào.</p>
                        <Button onClick={() => setIsAdding(true)} variant="secondary">Thêm ngay</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {currencies.length > ITEMS_PER_PAGE && (
          <div className="px-8 py-4 border-t border-gray-50 dark:border-[#2a2d3d] bg-slate-50/30 dark:bg-[#1a1c26] flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, currencies.length)} trên {currencies.length} tiền tệ
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Trước
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(currencies.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage >= Math.ceil(currencies.length / ITEMS_PER_PAGE)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
