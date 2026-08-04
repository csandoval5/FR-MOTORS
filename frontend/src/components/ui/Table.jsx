import { ChevronUp, ChevronDown, Search } from 'lucide-react'

/**
 * Tabla de datos reutilizable con ordenamiento y estados vacío/carga
 *
 * Props:
 * - columns: Array<{ key: string, label: string, sortable: boolean, render: function }>
 * - data: Array<object>
 * - loading: boolean
 * - sortColumn: string
 * - sortDirection: 'asc' | 'desc'
 * - onSort: function(colKey)
 * - emptyMessage: string
 * - onRowClick: function(row)
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  emptyMessage = 'No se encontraron registros',
  onRowClick,
  className = ''
}) {
  const renderSortIcon = (column) => {
    if (!column.sortable) return null
    if (sortColumn !== column.key) {
      return (
        <span className="inline-flex flex-col opacity-30">
          <ChevronUp className="w-3 h-3 -mb-1" />
          <ChevronDown className="w-3 h-3" />
        </span>
      )
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />
  }

  // Estado vacío
  if (!loading && data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                    ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                    ${col.align === 'right' ? 'text-right' : ''}
                    ${col.align === 'center' ? 'text-center' : ''}
                  `}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {renderSortIcon(col)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`
                        px-4 py-3 text-sm text-gray-700
                        ${col.align === 'right' ? 'text-right' : ''}
                        ${col.align === 'center' ? 'text-center' : ''}
                      `}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

