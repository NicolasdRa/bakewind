/**
 * Main Dashboard Page for BakeWind Admin
 *
 * Overview page showing key metrics and quick actions for bakery management
 */

import { Component, createResource, Show, For } from 'solid-js';
import { useAuth } from '../stores/authStore';
import { analyticsApi, ordersApi } from '../api/client';

const Dashboard: Component = () => {
  const auth = useAuth();

  // Fetch dashboard data
  const [dashboardStats] = createResource(async () => {
    if (!auth.isAuthenticated) return null;
    try {
      return await analyticsApi.getDashboardStats();
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      return null;
    }
  });

  const [recentOrders] = createResource(async () => {
    if (!auth.isAuthenticated) return [];
    try {
      const response = await ordersApi.getOrders({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      return response.orders || [];
    } catch (error) {
      console.error('Failed to load recent orders:', error);
      return [];
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div class="dashboard">
      <div class="dashboard-container">
        {/* Header */}
        <div class="dashboard-header">
          <div class="dashboard-greeting">
            <h1 class="dashboard-title">
              Welcome back, {auth.user?.firstName || 'User'}!
            </h1>
            <p class="dashboard-subtitle">
              {auth.user?.businessName || 'Your Bakery'} Dashboard
            </p>
          </div>

          <Show when={auth.user?.subscriptionStatus === 'trial'}>
            <div class="trial-status">
              <div class="trial-badge">
                <svg class="trial-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Trial Active
              </div>
              <Show when={auth.user?.trialEndsAt}>
                <p class="trial-expires">
                  Expires: {formatDate(auth.user!.trialEndsAt!)}
                </p>
              </Show>
            </div>
          </Show>
        </div>

        {/* Stats Grid */}
        <Show when={!dashboardStats.loading} fallback={
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        }>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon stat-icon-primary">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">Today's Orders</h3>
                <p class="stat-value">{dashboardStats()?.todayOrders || 0}</p>
                <p class="stat-change positive">+12% from yesterday</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-success">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2h6v2H7V6zm8 0h2v2h-2V6zM7 10h2v2H7v-2zm5 0h2v2h-2v-2z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">Today's Revenue</h3>
                <p class="stat-value">{formatCurrency(dashboardStats()?.todayRevenue || 0)}</p>
                <p class="stat-change positive">+8% from yesterday</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-warning">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">Active Customers</h3>
                <p class="stat-value">{dashboardStats()?.activeCustomers || 0}</p>
                <p class="stat-change neutral">Same as last week</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon stat-icon-info">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm9 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zM5 11a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm9 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">Low Stock Items</h3>
                <p class="stat-value">{dashboardStats()?.lowStockItems || 0}</p>
                <p class="stat-change negative">3 critical</p>
              </div>
            </div>
          </div>
        </Show>

        {/* Main Content Grid */}
        <div class="content-grid">
          {/* Recent Orders */}
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Recent Orders</h2>
              <a href="/orders" class="card-link">View all →</a>
            </div>

            <Show when={!recentOrders.loading} fallback={
              <div class="loading-placeholder">Loading orders...</div>
            }>
              <div class="orders-list">
                <For each={recentOrders()} fallback={
                  <p class="empty-state">No recent orders</p>
                }>
                  {(order) => (
                    <div class="order-item">
                      <div class="order-info">
                        <p class="order-number">#{order.orderNumber}</p>
                        <p class="order-customer">{order.customerName}</p>
                      </div>
                      <div class="order-details">
                        <span class="order-status" classList={{
                          'status-pending': order.status === 'pending',
                          'status-confirmed': order.status === 'confirmed',
                          'status-completed': order.status === 'completed',
                        }}>
                          {order.status}
                        </span>
                        <p class="order-amount">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>

          {/* Quick Actions */}
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Quick Actions</h2>
            </div>

            <div class="quick-actions">
              <a href="/orders/new" class="action-button">
                <div class="action-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span>New Order</span>
              </a>

              <a href="/products/new" class="action-button">
                <div class="action-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1.323c-1.045.084-2.084.248-3.077.488a1 1 0 00-.597 1.547L7.235 9.1a1 1 0 001.28.267A6.98 6.98 0 0110 9c.492 0 .974.051 1.44.142a1 1 0 001.24-.325l1.984-2.683a1 1 0 00-.613-1.55A13.967 13.967 0 0011 4.07V3a1 1 0 00-1-1zm0 8a3 3 0 100 6 3 3 0 000-6z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span>Add Product</span>
              </a>

              <a href="/inventory" class="action-button">
                <div class="action-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" />
                  </svg>
                </div>
                <span>Check Inventory</span>
              </a>

              <a href="/reports" class="action-button">
                <div class="action-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span>View Reports</span>
              </a>
            </div>
          </div>

          {/* Alerts/Notifications */}
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Alerts</h2>
              <a href="/settings/notifications" class="card-link">Settings →</a>
            </div>

            <div class="alerts-list">
              <div class="alert-item alert-warning">
                <div class="alert-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="alert-content">
                  <p class="alert-title">Low inventory alert</p>
                  <p class="alert-message">3 items are running low on stock</p>
                </div>
              </div>

              <div class="alert-item alert-info">
                <div class="alert-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="alert-content">
                  <p class="alert-title">New feature available</p>
                  <p class="alert-message">Production planning module is now live</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background-color: #f7f8fa;
          padding: 2rem;
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .dashboard-subtitle {
          color: #666;
          font-size: 1rem;
        }

        .trial-status {
          text-align: right;
        }

        .trial-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #10b981;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .trial-icon {
          width: 1rem;
          height: 1rem;
        }

        .trial-expires {
          color: #666;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #666;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e5e5e5;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon svg {
          width: 1.5rem;
          height: 1.5rem;
          color: white;
        }

        .stat-icon-primary { background: #3b82f6; }
        .stat-icon-success { background: #10b981; }
        .stat-icon-warning { background: #f59e0b; }
        .stat-icon-info { background: #8b5cf6; }

        .stat-content { flex: 1; }

        .stat-label {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .stat-change {
          font-size: 0.75rem;
        }

        .stat-change.positive { color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        .stat-change.neutral { color: #666; }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .content-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .card-link {
          color: #3b82f6;
          font-size: 0.875rem;
          text-decoration: none;
        }

        .card-link:hover {
          text-decoration: underline;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          border: 1px solid #e5e5e5;
          border-radius: 0.5rem;
        }

        .order-number {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .order-customer {
          font-size: 0.875rem;
          color: #666;
        }

        .order-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .order-status {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-confirmed {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }

        .order-amount {
          font-weight: 600;
          color: #1a1a1a;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid #e5e5e5;
          border-radius: 0.5rem;
          text-decoration: none;
          color: #1a1a1a;
          transition: all 0.2s;
        }

        .action-button:hover {
          background: #f7f8fa;
          border-color: #3b82f6;
        }

        .action-icon {
          width: 2rem;
          height: 2rem;
          background: #eff6ff;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-icon svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #3b82f6;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alert-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .alert-warning {
          background: #fef3c7;
        }

        .alert-info {
          background: #dbeafe;
        }

        .alert-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .alert-warning .alert-icon svg { color: #f59e0b; }
        .alert-info .alert-icon svg { color: #3b82f6; }

        .alert-title {
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .alert-message {
          font-size: 0.875rem;
          color: #666;
        }

        .empty-state {
          text-align: center;
          color: #666;
          padding: 2rem;
        }

        .loading-placeholder {
          text-align: center;
          color: #666;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;