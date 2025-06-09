import React, { memo, useMemo, useCallback } from 'react';

/**
 * Optimized List Component
 * Virtual scrolling ve memoization ile büyük listeleri efficiently render eder
 */
export const OptimizedList = memo(({ 
  items, 
  renderItem, 
  keyExtractor,
  itemHeight = 60,
  containerHeight = 400,
  loadMore,
  loading = false
}) => {
  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    // Virtual scrolling logic
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    return items.slice(0, visibleCount);
  }, [items, containerHeight, itemHeight]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Load more when near bottom
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && loadMore && !loading) {
      loadMore();
    }
  }, [loadMore, loading]);

  return (
    <div 
      className="overflow-y-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {visibleItems.map((item, index) => (
        <div key={keyExtractor(item, index)} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
});

OptimizedList.displayName = 'OptimizedList';

/**
 * Memoized Table Component
 * Büyük tablolar için performance optimization
 */
export const OptimizedTable = memo(({ 
  data, 
  columns, 
  onRowClick,
  loading = false,
  emptyMessage = 'Veri bulunamadı'
}) => {
  const memoizedRows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.map((row, index) => (
      <TableRow 
        key={row.id || index}
        row={row}
        columns={columns}
        onClick={() => onRowClick?.(row)}
      />
    ));
  }, [data, columns, onRowClick]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <TableHeader columns={columns} />
        <tbody className="bg-white divide-y divide-gray-200">
          {memoizedRows}
        </tbody>
      </table>
    </div>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

// Memoized Table Row Component
const TableRow = memo(({ row, columns, onClick }) => {
  const handleClick = useCallback(() => {
    onClick?.(row);
  }, [onClick, row]);

  return (
    <tr 
      className={onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      onClick={handleClick}
    >
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
          {column.render ? column.render(row[column.key], row) : row[column.key]}
        </td>
      ))}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

// Memoized Table Header
const TableHeader = memo(({ columns }) => (
  <thead className="bg-gray-50">
    <tr>
      {columns.map((column) => (
        <th 
          key={column.key}
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          {column.title}
        </th>
      ))}
    </tr>
  </thead>
));

TableHeader.displayName = 'TableHeader';

/**
 * Optimized Search Input
 * Debounced search ile performance optimization
 */
export const OptimizedSearchInput = memo(({ 
  onSearch, 
  placeholder = 'Ara...', 
  delay = 300,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => onSearch(value), delay);
    };
  }, [onSearch, delay]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={handleChange}
      placeholder={placeholder}
      className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
});

OptimizedSearchInput.displayName = 'OptimizedSearchInput';

export default {
  OptimizedList,
  OptimizedTable,
  OptimizedSearchInput
};
