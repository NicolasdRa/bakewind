import { Component, createSignal, createResource, For, Show } from "solid-js";
import { customersApi } from "../../api/customers";
import styles from "./CustomersPage.module.css";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dateOfBirth?: string;
  allergens?: string[];
  preferences?: string[];
  orderHistory: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate?: string;
  };
  loyalty: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  notes?: string;
}

const CustomersPage: Component = () => {
  const [customers] = createResource<Customer[]>(() => customersApi.getCustomers());
  const [selectedCustomer, setSelectedCustomer] = createSignal<Customer | null>(null);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedStatus, setSelectedStatus] = createSignal<string>('all');
  const [selectedTier, setSelectedTier] = createSignal<string>('all');

  const filteredCustomers = () => {
    let filtered = customers() || [];

    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(term) ||
        customer.lastName.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      );
    }

    if (selectedStatus() !== 'all') {
      filtered = filtered.filter(customer => customer.status === selectedStatus());
    }

    if (selectedTier() !== 'all') {
      filtered = filtered.filter(customer => customer.loyalty.tier === selectedTier());
    }

    return filtered;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'banned': return styles.statusBanned;
      default: return styles.statusInactive;
    }
  };

  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'bronze': return styles.tierBronze;
      case 'silver': return styles.tierSilver;
      case 'gold': return styles.tierGold;
      case 'platinum': return styles.tierPlatinum;
      default: return styles.tierSilver;
    }
  };

  const getTotalCustomers = () => customers()?.length || 0;
  const getActiveCustomers = () => customers()?.filter(c => c.status === 'active').length || 0;
  const getTotalRevenue = () => customers()?.reduce((sum, c) => sum + c.orderHistory.totalSpent, 0) || 0;
  const getAvgOrderValue = () => {
    const allCustomers = customers() || [];
    if (allCustomers.length === 0) return 0;
    const totalValue = allCustomers.reduce((sum, c) => sum + c.orderHistory.avgOrderValue, 0);
    return totalValue / allCustomers.length;
  };

  return (
    <div class={styles.pageContainer}>
      <div class={styles.pageHeader}>
        <h1 class={styles.pageTitle}>Customer Management</h1>
        <p class={styles.pageSubtitle}>Manage customer information and relationships</p>
      </div>

      {/* Stats Cards */}
      <div class={styles.statsGrid}>
        <div class={styles.statCard}>
          <h3 class={styles.statTitle}>Total Customers</h3>
          <p class={styles.statValuePrimary}>{getTotalCustomers()}</p>
        </div>
        <div class={styles.statCard}>
          <h3 class={styles.statTitle}>Active Customers</h3>
          <p class={styles.statValueSuccess}>{getActiveCustomers()}</p>
        </div>
        <div class={styles.statCard}>
          <h3 class={styles.statTitle}>Total Revenue</h3>
          <p class={styles.statValueInfo}>${getTotalRevenue().toFixed(2)}</p>
        </div>
        <div class={styles.statCard}>
          <h3 class={styles.statTitle}>Avg Order Value</h3>
          <p class={styles.statValueWarning}>${getAvgOrderValue().toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div class={styles.filterCard}>
        <div class={styles.filterGrid}>
          <div>
            <label class={styles.filterLabel}>Search Customers</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm()}
              onChange={(e) => setSearchTerm(e.target.value)}
              class={styles.filterInput}
            />
          </div>
          <div>
            <label class={styles.filterLabel}>Status</label>
            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.target.value)}
              class={styles.filterInput}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div>
            <label class={styles.filterLabel}>Loyalty Tier</label>
            <select
              value={selectedTier()}
              onChange={(e) => setSelectedTier(e.target.value)}
              class={styles.filterInput}
            >
              <option value="all">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
          <div class={styles.filterButtonWrapper}>
            <button class={styles.addButton}>
              Add Customer
            </button>
          </div>
        </div>
      </div>

      <div class={styles.mainGrid}>
        {/* Customer List */}
        <div>
          <div class={styles.listCard}>
            <div class={styles.listHeader}>
              <h2 class={styles.listTitle}>
                Customers ({filteredCustomers().length})
              </h2>
            </div>

            <Show
              when={!customers.loading}
              fallback={
                <div class={styles.loadingContainer}>
                  <div class={styles.spinner}></div>
                </div>
              }
            >
              <Show
                when={filteredCustomers().length > 0}
                fallback={
                  <div class={styles.emptyState}>
                    No customers found matching your criteria.
                  </div>
                }
              >
                <div class={styles.customerList}>
                  <For each={filteredCustomers()}>
                    {(customer) => (
                      <div
                        class={styles.customerItem}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div class={styles.customerItemContent}>
                          <div class={styles.customerInfo}>
                            <div class={styles.customerNameRow}>
                              <h3 class={styles.customerName}>
                                {customer.firstName} {customer.lastName}
                              </h3>
                              <span class={`${styles.statusBadge} ${getStatusClass(customer.status)}`}>
                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                              </span>
                              <span class={`${styles.tierBadge} ${getTierClass(customer.loyalty.tier)}`}>
                                {customer.loyalty.tier.charAt(0).toUpperCase() + customer.loyalty.tier.slice(1)}
                              </span>
                            </div>

                            <div class={styles.customerContact}>
                              <p>{customer.email}</p>
                              <Show when={customer.phone}>
                                <p>{customer.phone}</p>
                              </Show>
                            </div>

                            <div class={styles.customerStatsGrid}>
                              <div>
                                <span class={styles.statLabel}>Orders:</span> {customer.orderHistory.totalOrders}
                              </div>
                              <div>
                                <span class={styles.statLabel}>Spent:</span> ${customer.orderHistory.totalSpent.toFixed(2)}
                              </div>
                              <div>
                                <span class={styles.statLabel}>Points:</span> {customer.loyalty.points}
                              </div>
                            </div>
                          </div>

                          <div class={styles.customerActions}>
                            <button class={styles.actionLink}>Edit</button>
                            <button class={styles.actionLinkSecondary}>Orders</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </div>

        {/* Customer Detail */}
        <div>
          <Show
            when={selectedCustomer()}
            fallback={
              <div class={styles.detailEmpty}>
                Select a customer to view details
              </div>
            }
          >
            {(customer) => (
              <div class={styles.detailCard}>
                <div class={styles.detailHeader}>
                  <h2 class={styles.detailName}>
                    {customer().firstName} {customer().lastName}
                  </h2>
                  <p class={styles.detailEmail}>{customer().email}</p>
                </div>

                <div class={styles.detailContent}>
                  {/* Contact Information */}
                  <div class={styles.detailSection}>
                    <h3 class={styles.sectionTitle}>Contact Information</h3>
                    <div class={styles.detailRow}>
                      <Show when={customer().phone}>
                        <div>
                          <span class={styles.detailLabel}>Phone:</span> <span class={styles.detailValue}>{customer().phone}</span>
                        </div>
                      </Show>
                      <Show when={customer().address}>
                        <div>
                          <span class={styles.detailLabel}>Address:</span>
                          <div class={styles.addressBlock}>
                            {customer().address!.street}<br/>
                            {customer().address!.city}, {customer().address!.state} {customer().address!.zipCode}
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>

                  {/* Order History */}
                  <div class={styles.detailSection}>
                    <h3 class={styles.sectionTitle}>Order History</h3>
                    <div class={styles.orderHistoryGrid}>
                      <div>
                        <span class={styles.orderStatLabel}>Total Orders:</span>
                        <div class={styles.orderStatValuePrimary}>{customer().orderHistory.totalOrders}</div>
                      </div>
                      <div>
                        <span class={styles.orderStatLabel}>Total Spent:</span>
                        <div class={styles.orderStatValueSuccess}>${customer().orderHistory.totalSpent.toFixed(2)}</div>
                      </div>
                      <div>
                        <span class={styles.orderStatLabel}>Avg Order:</span>
                        <div class={styles.orderStatValueInfo}>${customer().orderHistory.avgOrderValue.toFixed(2)}</div>
                      </div>
                      <div>
                        <span class={styles.orderStatLabel}>Last Order:</span>
                        <div class={styles.lastOrderValue}>
                          {customer().orderHistory.lastOrderDate ?
                            new Date(customer().orderHistory.lastOrderDate!).toLocaleDateString() :
                            'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty Information */}
                  <div class={styles.detailSection}>
                    <h3 class={styles.sectionTitle}>Loyalty Program</h3>
                    <div class={styles.loyaltyRow}>
                      <span class={styles.loyaltyLabel}>Tier:</span>
                      <span class={`${styles.tierBadge} ${getTierClass(customer().loyalty.tier)}`}>
                        {customer().loyalty.tier.charAt(0).toUpperCase() + customer().loyalty.tier.slice(1)}
                      </span>
                    </div>
                    <div class={styles.loyaltyRow}>
                      <span class={styles.loyaltyLabel}>Points:</span>
                      <span class={styles.loyaltyPoints}>{customer().loyalty.points}</span>
                    </div>
                  </div>

                  {/* Dietary Information */}
                  <Show when={customer().allergens && customer().allergens!.length > 0}>
                    <div class={styles.detailSection}>
                      <h3 class={styles.sectionTitle}>Allergens</h3>
                      <div class={styles.tagList}>
                        <For each={customer().allergens}>
                          {(allergen) => (
                            <span class={styles.allergenTag}>
                              {allergen}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={customer().preferences && customer().preferences!.length > 0}>
                    <div class={styles.detailSection}>
                      <h3 class={styles.sectionTitle}>Preferences</h3>
                      <div class={styles.tagList}>
                        <For each={customer().preferences}>
                          {(preference) => (
                            <span class={styles.preferenceTag}>
                              {preference}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={customer().notes}>
                    <div class={styles.detailSection}>
                      <h3 class={styles.sectionTitle}>Notes</h3>
                      <p class={styles.notesText}>{customer().notes}</p>
                    </div>
                  </Show>

                  <div class={styles.detailActions}>
                    <button class={styles.viewOrdersButton}>
                      View Orders
                    </button>
                    <button class={styles.editButton}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;