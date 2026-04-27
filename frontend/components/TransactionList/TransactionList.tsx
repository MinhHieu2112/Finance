import React, { useEffect, useMemo, useState } from 'react';
import type { TransactionListProps } from './types';
import { TransactionType } from './types';
import { Trash2, TrendingUp, TrendingDown, Search, Filter, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, categoryOptions, onDelete, onEdit }) => {
  const ITEMS_PER_PAGE = 10;

//--------------- Hàm định dạng ngày tháng ---------------
  const formatDisplayDate = (rawDate: string) => {
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return rawDate;

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const [searchTerm, setSearchTerm]         = useState('');
  const [typeFilter, setTypeFilter]         = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [currentPage, setCurrentPage]       = useState(1);
  const [expandedIds, setExpandedIds]       = useState<string[]>([]);

//--------------- Hàm nhóm category options theo catalogName và lọc theo typeFilter ----------------
  const groupedCategoryOptions = useMemo(() => {
    if (!typeFilter) return [];

    // Gom nhóm bằng reduce
    const groups = categoryOptions
      .filter(cat => cat.type === typeFilter)
      .reduce((acc, cat) => {
        const key = cat.catalogName || 'Uncategorized Catalog';
        (acc[key] = acc[key] || []).push(cat);
        return acc;
      }, {} as Record<string, typeof categoryOptions>);

    // Chuyển object thành mảng và sắp xếp
    return Object.entries(groups)
      .map(([catalogName, options]) => ({ catalogName, options }))
      .sort((a, b) => a.catalogName.localeCompare(b.catalogName));
    }, [categoryOptions, typeFilter]);

  useEffect(() => {
    if (!categoryFilter) {
      return;
    }

    const categoryStillExists = groupedCategoryOptions.some((group) =>
      group.options.some((category) => category.name === categoryFilter),
    );

    if (!categoryStillExists) {
      setCategoryFilter('');
    }
  }, [groupedCategoryOptions, categoryFilter]);

  //--------------- Hàm lọc, tìm kiếm, sắp xếp transactions ----------------
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch    = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType      = typeFilter ? t.type === typeFilter : true;
        const matchesCategory  = categoryFilter
          ? t.details.some((detail) => detail.categoryName === categoryFilter)
          : true;
        const matchesStartDate = startDate ? new Date(t.date) >= new Date(startDate) : true;
        const matchesEndDate   = endDate ? new Date(t.date) <= new Date(endDate) : true;

        return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, typeFilter, categoryFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || typeFilter || categoryFilter || startDate || endDate;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, startDate, endDate, transactions]);

  useEffect(() => {
    setExpandedIds((prev) => prev.filter((id) => transactions.some((transaction) => transaction._id === id)));
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(pageStart, pageStart + ITEMS_PER_PAGE);


  const toggleExpandedRow = (id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden transition-colors">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Giao dịch gần đây</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">Tìm thấy {filteredTransactions.length} kết quả</p>
        </div>

        {/* Search input */ }
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
          <input
            type        = "text"
            placeholder = "Tìm kiếm thông tin..."
            value       = {searchTerm}
            onChange    = {(e) => setSearchTerm(e.target.value)}
            className   = "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          />
        </div>
      </div>

        {/* Filter section */ }
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Nhãn bộ lọc */}
            <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Filter size={14} />
              <span>Bộ lọc</span>
            </div>

            {/* Nhóm Select (Loại & Danh mục) */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as TransactionType | '');
                    setCategoryFilter('');
                  }}
                  className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 min-w-[120px]"
                >
                  <option value="">Tất cả loại</option>
                  <option value={TransactionType.EXPENSE}>Chi phí</option>
                  <option value={TransactionType.INCOME}>Thu nhập</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  disabled={!typeFilter || groupedCategoryOptions.length === 0}
                  className={`appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm transition-all outline-none min-w-[160px] ${
                    !typeFilter 
                      ? 'bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                >
                  <option value="">{typeFilter ? 'Tất cả danh mục' : 'Chọn loại trước'}</option>
                  {groupedCategoryOptions.map((group) => (
                    <optgroup key={group.catalogName} label={group.catalogName}>
                      {group.options.map((category) => (
                        <option key={category._id} value={category.name}>{category.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Nhóm Ngày tháng */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-1 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-sm text-gray-600 dark:text-slate-300 bg-transparent focus:outline-none border-none"
              />
              <span className="text-gray-300 dark:text-slate-500">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-sm text-gray-600 dark:text-slate-300 bg-transparent focus:outline-none border-none"
              />
            </div>

            {/* Nút Xóa bộ lọc */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
              >
                <Trash2 size={14} />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
          <thead className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700/50 text-xs uppercase font-medium text-gray-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Phân loại</th>
              <th className="px-6 py-4">Chi tiết</th>
              <th className="px-6 py-4 text-right">Tổng giá trị</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {paginatedTransactions.map((t) => {
              const isExpanded = expandedIds.includes(t._id);

              return (
                <React.Fragment key={t._id}>
                  <tr
                    onClick={() => toggleExpandedRow(t._id)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-slate-400" title={t.date}>
                      {formatDisplayDate(t.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2">
                        <span className={`p-2 rounded-full flex-shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                          {t.type === TransactionType.INCOME ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${t.type === TransactionType.INCOME ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                          {t.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="truncate max-w-[200px]" title={t.description}>
                          {t.description}
                        </span>
                        <span className="ml-auto text-gray-400 dark:text-slate-500">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-slate-100'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}
                      {Math.round(t.total_amount).toLocaleString('en-US')} VND
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(t);
                          }}
                          className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 rounded-full"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(t._id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50/70 dark:bg-slate-700/20">
                      <td colSpan={5} className="px-6 pb-4 pt-1">
                        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-xl p-4 shadow-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-500">Phân loại</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">{t.type}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-500">Tần suất</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{t.frequency}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-500">Cập nhật lần cuối</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{formatDisplayDate(t.updatedAt || t.createdAt || t.date)}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-500 mb-2">
                              Chi tiết giao dịch
                            </p>
                            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-1 text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-500">
                              <span className="sm:col-span-4">Tên</span>
                              <span className="sm:col-span-4">Danh mục</span>
                              <span className="sm:col-span-2">Số lượng</span>
                              <span className="sm:col-span-2 text-right">Tổng</span>
                            </div>
                            <div className="space-y-2">
                              {t.details.map((detail, index) => (
                                <div
                                  key={`${t._id}-${index}`}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-3 py-2 border border-gray-100 dark:border-slate-700/50 rounded-lg bg-gray-50 dark:bg-slate-700/30"
                                >
                                  <div className="sm:col-span-4">
                                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{detail.name || '-'}</p>
                                  </div>
                                  <div className="sm:col-span-4">
                                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 rounded text-xs whitespace-nowrap">
                                      {detail.categoryName || 'Other'}
                                    </span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{detail.quantity ?? 1}</p>
                                  </div>
                                  <div className="sm:col-span-2 sm:text-right">
                                    <span className={`text-sm font-semibold ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-slate-200'}`}>
                                      {Math.round(detail.amount).toLocaleString('en-US')} VND
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  {hasActiveFilters ? 'Không có giao dịch nào phù hợp với bộ lọc hiện tại của bạn!' : 'Chưa có giao dịch nào. Nhấp vào "Thêm giao dịch" để bắt đầu.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Showing {pageStart + 1}-{Math.min(pageStart + ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 disabled:text-gray-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600 dark:text-slate-400">Trang {safeCurrentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 disabled:text-gray-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
