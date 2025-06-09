import { useMemo, useCallback } from 'react';

/**
 * Performance optimized hooks for React components
 */

/**
 * Memoized data transformation hook
 * Prevents unnecessary re-calculations
 */
export const useMemoizedData = (data, transformFn, dependencies = []) => {
  return useMemo(() => {
    if (!data) return null;
    return transformFn(data);
  }, [data, ...dependencies]);
};

/**
 * Debounced callback hook
 * Useful for search inputs, API calls
 */
export const useDebouncedCallback = (callback, delay = 300, dependencies = []) => {
  return useCallback(
    debounce(callback, delay),
    dependencies
  );
};

/**
 * Memoized filter function
 * Optimizes list filtering operations
 */
export const useMemoizedFilter = (items, filterFn, dependencies = []) => {
  return useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter(filterFn);
  }, [items, ...dependencies]);
};

/**
 * Pagination optimization hook
 * Prevents full array processing on each page change
 */
export const usePaginatedData = (data, page, itemsPerPage) => {
  return useMemo(() => {
    if (!Array.isArray(data)) return { items: [], totalPages: 0 };
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    
    return { items, totalPages };
  }, [data, page, itemsPerPage]);
};

/**
 * Optimized form handler
 * Reduces re-renders in form components
 */
export const useOptimizedFormHandler = (initialState, onSubmit) => {
  const [state, setState] = useState(initialState);
  
  const handleChange = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(state);
  }, [state, onSubmit]);
  
  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);
  
  return { state, handleChange, handleSubmit, reset };
};

// Utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
