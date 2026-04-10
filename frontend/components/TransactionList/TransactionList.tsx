import React, { useEffect, useMemo, useState } from 'react';
import type { TransactionListProps } from './types';
import { TransactionType } from './types';
import { Trash2, TrendingUp, TrendingDown, Search, Filter, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';

const getPrimaryCategoryName = (transaction: { details: Array<{ categoryName: string }> }) => {
  return transaction.details[0]?.categoryName || 'Other';
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, categoryOptions, onDelete, onEdit }) => {
  const ITEMS_PER_PAGE = 10;

  const formatDisplayDate = (rawDate: string) => {
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    const iso = parsedDate.toISOString();
    return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
  };

  const [searchTerm, setSearchTerm]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [currentPage, setCurrentPage]       = useState(1);
  const [expandedIds, setExpandedIds]       = useState<string[]>([]);

  const allCategoryOptions = useMemo(() => {
    const categoriesFromTransactions = transactions.flatMap((transaction) =>
      transaction.details.map((detail) => detail.categoryName),
    );
    return Array.from(new Set([...categoryOptions, ...categoriesFromTransactions])).filter(Boolean);
  }, [transactions, categoryOptions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch    = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory  = categoryFilter
          ? t.details.some((detail) => detail.categoryName === categoryFilter)
          : true;
        const matchesStartDate = startDate ? new Date(t.date) >= new Date(startDate) : true;
        const matchesEndDate   = endDate ? new Date(t.date) <= new Date(endDate) : true;

        return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, categoryFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || categoryFilter || startDate || endDate;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, startDate, endDate, transactions]);

  useEffect(() => {
    setExpandedIds((prev) => prev.filter((id) => transactions.some((transaction) => transaction._id === id)));
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const toggleExpandedRow = (transactionId: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(transactionId)) {
        return prev.filter((id) => id !== transactionId);
      }

      return [...prev, transactionId];
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
          <p className="text-sm text-gray-500">Found {filteredTransactions.length} results</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type        = "text"
            placeholder = "Search by description..."
            value       = {searchTerm}
            onChange    = {(e) => setSearchTerm(e.target.value)}
            className   = "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mr-2">
          <Filter size={16} />
          <span>Filters:</span>
        </div>

        <select
          value     = {categoryFilter}
          onChange  = {(e) => setCategoryFilter(e.target.value)}
          className = "px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-gray-300 transition-colors"
        >
          <option value="">All categories</option>
          {allCategoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="date"
            value       = {startDate}
            onChange    = {(e) => setStartDate(e.target.value)}
            className   = "px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary hover:border-gray-300 transition-colors"
            placeholder = "From date"
            title       = "From date"
          />
          <span className="text-gray-400 hidden sm:inline">-</span>
          <input
            type        = "date"
            value       = {endDate}
            onChange    = {(e) => setEndDate(e.target.value)}
            className   = "px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary hover:border-gray-300 transition-colors"
            placeholder = "To date"
            title       = "To date"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors"
          >
            <X size={16} /> Clear filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-white border-b border-gray-100 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Categories</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedTransactions.map((t) => {
              const isExpanded = expandedIds.includes(t._id);

              return (
                <React.Fragment key={t._id}>
                  <tr
                    onClick={() => toggleExpandedRow(t._id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500" title={t.date}>
                      {formatDisplayDate(t.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-full flex-shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type === TransactionType.INCOME ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </span>
                        <span className="truncate max-w-[200px]" title={t.description}>
                          {t.description}
                        </span>
                        <span className="ml-auto text-gray-400">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap">
                        {Array.from(new Set(t.details.map((detail) => detail.categoryName))).slice(0, 2).join(', ') || getPrimaryCategoryName(t)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-800'}`}>
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
                          title="Edit transaction"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(t._id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                          title="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={5} className="px-6 pb-4 pt-1">
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Type</p>
                              <p className="text-sm font-medium text-gray-700 capitalize">{t.type}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Frequency</p>
                              <p className="text-sm font-medium text-gray-700">{t.frequency}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Last updated</p>
                              <p className="text-sm font-medium text-gray-700">{formatDisplayDate(t.updatedAt || t.createdAt || t.date)}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 mb-2">
                              Transaction Details
                            </p>
                            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-1 text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                              <span className="sm:col-span-6">Name</span>
                              <span className="sm:col-span-2">Quantity</span>
                              <span className="sm:col-span-4 text-right">Amount</span>
                            </div>
                            <div className="space-y-2">
                              {t.details.map((detail, index) => (
                                <div
                                  key={`${t._id}-${index}`}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-3 py-2 border border-gray-100 rounded-lg bg-gray-50"
                                >
                                  <div className="sm:col-span-6">
                                    <p className="text-sm font-medium text-gray-700">{detail.name || '-'}</p>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <p className="text-sm font-medium text-gray-700">{detail.quantity ?? 1}</p>
                                  </div>
                                  <div className="sm:col-span-4 sm:text-right">
                                    <span className={`text-sm font-semibold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-800'}`}>
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
                  {hasActiveFilters ? 'No transactions match your current filters.' : 'No transactions yet. Click "Add Transaction" to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-500">
            Showing {pageStart + 1}-{Math.min(pageStart + ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {safeCurrentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
