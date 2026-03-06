import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { CATEGORY_OPTIONS } from '../../constants';
import { Trash2, TrendingUp, TrendingDown, Search, Filter, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
      const matchesStartDate = startDate ? new Date(t.date) >= new Date(startDate) : true;
      const matchesEndDate = endDate ? new Date(t.date) <= new Date(endDate) : true;

      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, categoryFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || categoryFilter || startDate || endDate;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header & Search */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
           <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
           <p className="text-sm text-gray-500">
             {filteredTransactions.length} {filteredTransactions.length === 1 ? 'entry' : 'entries'} found
           </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
           <input 
              type="text" 
              placeholder="Search description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
           />
        </div>
      </div>

      {/* Filter Options */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3 items-center">
         <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mr-2">
            <Filter size={16} />
            <span>Filters:</span>
         </div>

         {/* Category Filter */}
         <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-gray-300 transition-colors"
         >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map(cat => (
               <option key={cat} value={cat}>{cat}</option>
            ))}
         </select>

         {/* Date Filters */}
         <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <input 
               type="date" 
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary hover:border-gray-300 transition-colors"
               placeholder="Start Date"
            />
            <span className="text-gray-400 hidden sm:inline">-</span>
            <input 
               type="date" 
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary hover:border-gray-300 transition-colors"
               placeholder="End Date"
            />
         </div>

         {/* Clear Button */}
         {hasActiveFilters && (
            <button 
               onClick={clearFilters}
               className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors"
            >
               <X size={16} /> Clear Filters
            </button>
         )}
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-white border-b border-gray-100 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{t.date}</td>
                <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                  <span className={`p-2 rounded-full flex-shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                     {t.type === TransactionType.INCOME ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </span>
                  <span className="truncate max-w-[200px]" title={t.description}>{t.description}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap">
                    {t.category}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-800'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                    title="Delete Transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                   {hasActiveFilters 
                     ? 'No transactions match your search filters.' 
                     : 'No transactions found. Click "Add Transaction" to start.'
                   }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
