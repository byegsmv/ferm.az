'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  Download, Eye, Edit3, Trash2, CheckCircle2, XCircle,
  MoreVertical, RefreshCw, Plus, CheckSquare, Square
} from 'lucide-react';

export default function DynamicDataTable({
  title = 'Məlumat Cədvəli',
  data = [],
  columns = [],
  onAdd,
  onEdit,
  onDelete,
  onBulkAction,
  isLoading = false,
  enableSelection = true,
  enableExport = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(columns[0]?.key || 'id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.key));
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Filter and Sort Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    // Status filter if available
    if (activeFilter !== 'ALL') {
      result = result.filter(item => item.status === activeFilter);
    }

    // Sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn] ?? '';
        const valB = b[sortColumn] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, activeFilter]);

  const toggleSort = (key) => {
    if (sortColumn === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === processedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedData.map(d => d.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (!processedData.length) return;
    const header = columns.filter(c => visibleColumns.includes(c.key)).map(c => c.label).join(',');
    const rows = processedData.map(row =>
      columns.filter(c => visibleColumns.includes(c.key)).map(c => `"${row[c.key] ?? ''}"`).join(',')
    ).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + '\n' + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 to-white">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
              {processedData.length} qeyd
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Dinamik data cədvəli və qabaqcıl idarəetmə</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cədvəldə axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Export Button */}
          {enableExport && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
              title="CSV kimi yüklə"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Eksport</span>
            </button>
          )}

          {/* Add New Button */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Əlavə Et</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Items Bulk Bar */}
      {selectedIds.length > 0 && (
        <div className="px-5 py-2.5 bg-brand-50/70 border-b border-brand-200/60 flex items-center justify-between animate-fadeIn">
          <span className="text-xs font-semibold text-brand-900">
            {selectedIds.length} element seçildi
          </span>
          <div className="flex items-center gap-2">
            {onBulkAction && (
              <button
                onClick={() => onBulkAction('DELETE', selectedIds)}
                className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
              >
                Toplu Sil
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Ləğv et
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50/80 text-gray-600 uppercase text-[11px] tracking-wider border-b border-gray-200/80 select-none">
            <tr>
              {enableSelection && (
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={processedData.length > 0 && selectedIds.length === processedData.length}
                    onChange={toggleSelectAll}
                    className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                </th>
              )}
              {columns
                .filter(col => visibleColumns.includes(col.key))
                .map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && toggleSort(col.key)}
                    className={`p-3.5 font-semibold text-gray-700 ${col.sortable !== false ? 'cursor-pointer hover:bg-gray-100/80' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable !== false && (
                        sortColumn === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-40 hover:opacity-100" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              {(onEdit || onDelete) && (
                <th className="p-3.5 text-right font-semibold text-gray-700">Əməliyyatlar</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  Məlumatlar yüklənir...
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-gray-400">
                  Heç bir qeyd tapılmadı
                </td>
              </tr>
            ) : (
              processedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`hover:bg-gray-50/70 transition-colors ${selectedIds.includes(row.id) ? 'bg-brand-50/30' : ''}`}
                >
                  {enableSelection && (
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                    </td>
                  )}
                  {columns
                    .filter(col => visibleColumns.includes(col.key))
                    .map(col => (
                      <td key={col.key} className="p-3.5 text-gray-800">
                        {col.render ? (
                          col.render(row[col.key], row)
                        ) : col.type === 'badge' ? (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            row[col.key] === 'ACTIVE' || row[col.key] === 'PAID' || row[col.key] === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row[col.key] === 'PENDING' || row[col.key] === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {row[col.key]}
                          </span>
                        ) : col.type === 'currency' ? (
                          <span className="font-semibold text-gray-900">
                            ₼ {Number(row[col.key] || 0).toFixed(2)}
                          </span>
                        ) : (
                          row[col.key] ?? '—'
                        )}
                      </td>
                    ))}

                  {(onEdit || onDelete) && (
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Düzəliş et"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
