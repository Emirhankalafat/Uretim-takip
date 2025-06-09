import { createSelector } from '@reduxjs/toolkit';

/**
 * Memoized selectors for performance optimization
 * Prevents unnecessary re-computations
 */

// Auth selectors
export const selectAuthState = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

// Memoized user permissions selector
export const selectUserPermissions = createSelector(
  [selectUser],
  (user) => {
    if (!user?.permissions) return [];
    return user.permissions.map(p => p.Name || p.name);
  }
);

// Orders selectors
export const selectOrdersState = (state) => state.orders || {};
export const selectOrders = (state) => state.orders?.items || [];
export const selectOrdersLoading = (state) => state.orders?.loading || false;

// Memoized filtered orders selector
export const selectFilteredOrders = createSelector(
  [selectOrders, (state, filters) => filters],
  (orders, filters) => {
    if (!filters || Object.keys(filters).length === 0) return orders;
    
    return orders.filter(order => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        switch (key) {
          case 'status':
            return order.status === value;
          case 'customer':
            return order.customer?.Name?.toLowerCase().includes(value.toLowerCase());
          case 'search':
            return order.order_number?.toLowerCase().includes(value.toLowerCase()) ||
                   order.notes?.toLowerCase().includes(value.toLowerCase());
          default:
            return true;
        }
      });
    });
  }
);

// Memoized orders by status selector
export const selectOrdersByStatus = createSelector(
  [selectOrders],
  (orders) => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: orders.length,
      pending: statusCounts.PENDING || 0,
      inProgress: statusCounts.IN_PROGRESS || 0,
      completed: statusCounts.COMPLETED || 0,
      cancelled: statusCounts.CANCELLED || 0
    };
  }
);

// Products selectors
export const selectProductsState = (state) => state.products || {};
export const selectProducts = (state) => state.products?.items || [];

// Memoized products by category selector
export const selectProductsByCategory = createSelector(
  [selectProducts],
  (products) => {
    return products.reduce((acc, product) => {
      const categoryName = product.category?.Name || 'Diğer';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {});
  }
);

// Customers selectors
export const selectCustomersState = (state) => state.customers || {};
export const selectCustomers = (state) => state.customers?.items || [];

// Memoized customer options selector (for dropdowns)
export const selectCustomerOptions = createSelector(
  [selectCustomers],
  (customers) => {
    return customers.map(customer => ({
      value: customer.id,
      label: customer.Name
    }));
  }
);

// Dashboard selectors
export const selectDashboardStats = createSelector(
  [selectOrders, selectProducts, selectCustomers],
  (orders, products, customers) => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const thisMonthOrders = orders.filter(order => 
      new Date(order.created_at) >= thisMonth
    );
    
    return {
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      thisMonthOrders: thisMonthOrders.length,
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length
    };
  }
);

// Performance monitoring selector
export const selectLoadingStates = createSelector(
  [
    (state) => state.auth?.loading,
    (state) => state.orders?.loading,
    (state) => state.products?.loading,
    (state) => state.customers?.loading
  ],
  (authLoading, ordersLoading, productsLoading, customersLoading) => ({
    auth: authLoading || false,
    orders: ordersLoading || false,
    products: productsLoading || false,
    customers: customersLoading || false,
    isAnyLoading: authLoading || ordersLoading || productsLoading || customersLoading
  })
);

// Error states selector
export const selectErrorStates = createSelector(
  [
    (state) => state.auth?.error,
    (state) => state.orders?.error,
    (state) => state.products?.error,
    (state) => state.customers?.error
  ],
  (authError, ordersError, productsError, customersError) => ({
    auth: authError,
    orders: ordersError,
    products: productsError,
    customers: customersError,
    hasAnyError: !!(authError || ordersError || productsError || customersError)
  })
);

export default {
  selectAuthState,
  selectUser,
  selectIsAuthenticated,
  selectUserPermissions,
  selectOrdersState,
  selectOrders,
  selectOrdersLoading,
  selectFilteredOrders,
  selectOrdersByStatus,
  selectProductsState,
  selectProducts,
  selectProductsByCategory,
  selectCustomersState,
  selectCustomers,
  selectCustomerOptions,
  selectDashboardStats,
  selectLoadingStates,
  selectErrorStates
};
