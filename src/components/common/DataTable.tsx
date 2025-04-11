import React, { useState, useMemo } from 'react';

export type ColumnDefinition<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
  width?: string;
};

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  keyField: keyof T;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  bordered?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

function DataTable<T>({
  data,
  columns,
  keyField,
  className = '',
  striped = true,
  hoverable = true,
  compact = false,
  bordered = false,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: ColumnDefinition<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return;

    const accessor = column.accessor as keyof T;
    if (sortColumn === accessor) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(accessor);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      // Handle null and undefined values
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      // Compare based on value type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Convert to string as fallback
      const aString = String(aValue);
      const bString = String(bValue);

      return sortDirection === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [data, sortColumn, sortDirection]);

  // Render cell content based on accessor type
  const renderCell = (item: T, column: ColumnDefinition<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor] as React.ReactNode;
  };

  // Get table and row styling based on props
  const getTableClasses = () => {
    return `min-w-full divide-y divide-neutral-200 ${
      bordered ? 'border border-neutral-200' : ''
    } ${className}`;
  };

  const getRowClasses = (index: number) => {
    return `${striped && index % 2 === 1 ? 'bg-neutral-50' : 'bg-white'} ${
      hoverable ? 'hover:bg-neutral-100' : ''
    } ${onRowClick ? 'cursor-pointer' : ''}`;
  };

  const getCellClasses = (column: ColumnDefinition<T>) => {
    return `${
      compact ? 'px-3 py-2' : 'px-6 py-4'
    } whitespace-nowrap text-sm text-neutral-800 ${column.className || ''}`;
  };

  // Sort icon based on current sort state
  const getSortIcon = (column: ColumnDefinition<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return null;

    const accessor = column.accessor as keyof T;
    const isSorted = sortColumn === accessor;

    if (!isSorted) {
      return (
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className={getTableClasses()}>
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`${
                  compact ? 'px-3 py-2' : 'px-6 py-3'
                } text-left text-xs font-medium text-neutral-700 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer' : ''
                } ${column.width ? column.width : ''}`}
                onClick={() => column.sortable && handleSort(column)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span className="ml-1">{getSortIcon(column)}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-neutral-600">
                <div className="flex justify-center items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-neutral-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item, rowIndex) => (
              <tr
                key={String(item[keyField])}
                className={getRowClasses(rowIndex)}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={getCellClasses(column)}>
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
