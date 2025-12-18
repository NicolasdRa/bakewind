import { Component, createSignal, createResource, createEffect, For, Show } from "solid-js";
import { Customer, customersApi, CustomerQueryParams, CustomersResponse, ImportResult, CreateCustomerDto } from "../../api/customers";
import CustomerFormModal from "../../components/customers/CustomerFormModal";
import CustomerDetailsModal from "../../components/customers/CustomerDetailsModal";
import Badge from "../../components/common/Badge";
import styles from "./CustomersPage.module.css";

const CustomersPage: Component = () => {
  // Query params for filtering
  const [queryParams, setQueryParams] = createSignal<CustomerQueryParams>({
    page: 1,
    limit: 20,
  });

  // Fetch customers with query params
  const [customersData, { refetch }] = createResource<CustomersResponse, CustomerQueryParams>(
    queryParams,
    (params) => customersApi.getCustomers(params)
  );

  // UI state
  const [selectedCustomer, setSelectedCustomer] = createSignal<Customer | null>(null);
  const [searchTerm, setSearchTerm] = createSignal("");
  const [selectedStatus, setSelectedStatus] = createSignal<string>("all");
  const [selectedType, setSelectedType] = createSignal<string>("all");

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = createSignal(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = createSignal(false);
  const [editingCustomer, setEditingCustomer] = createSignal<Customer | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = createSignal(false);
  const [importData, setImportData] = createSignal("");
  const [importResult, setImportResult] = createSignal<ImportResult | null>(null);
  const [isImporting, setIsImporting] = createSignal(false);
  const [isExporting, setIsExporting] = createSignal(false);

  // Debounce timer for search
  let searchTimeout: number | undefined;

  // Server-side search effect
  createEffect(() => {
    const term = searchTerm();
    const status = selectedStatus();
    const type = selectedType();

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search for 300ms
    searchTimeout = setTimeout(() => {
      setQueryParams((prev) => ({
        ...prev,
        page: 1, // Reset to first page on filter change
        search: term || undefined,
        status: status !== "all" ? (status as "active" | "inactive") : undefined,
        customerType: type !== "all" ? (type as "business" | "individual") : undefined,
      }));
    }, 300) as unknown as number;
  });

  // Get customers list from response (no client-side filtering needed now)
  const customers = () => customersData()?.customers || [];
  const filteredCustomers = () => customers();

  // Stats calculations
  const getTotalCustomers = () => customersData()?.pagination.total || customers().length;
  const getActiveCustomers = () => customers().filter((c) => c.status === "active").length;
  const getBusinessCustomers = () => customers().filter((c) => c.customerType === "business").length;
  const getTotalRevenue = () => customers().reduce((sum, c) => sum + c.totalSpent, 0);

  // Modal handlers
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const handleFormClose = () => {
    setIsFormModalOpen(false);
    setEditingCustomer(null);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingCustomer(null);
    refetch();
  };

  const handleDetailsClose = () => {
    setIsDetailsModalOpen(false);
  };

  const handleDetailsEdit = () => {
    const customer = selectedCustomer();
    if (customer) {
      setIsDetailsModalOpen(false);
      handleEditCustomer(customer);
    }
  };

  // Import handlers
  const handleOpenImport = () => {
    setImportData("");
    setImportResult(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImport = () => {
    setIsImportModalOpen(false);
    setImportData("");
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!importData().trim()) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // Parse JSON input
      const customers: CreateCustomerDto[] = JSON.parse(importData());

      if (!Array.isArray(customers)) {
        throw new Error("Input must be a JSON array of customer objects");
      }

      const result = await customersApi.importCustomers(customers);
      setImportResult(result);

      if (result.imported > 0) {
        refetch();
      }
    } catch (error: any) {
      setImportResult({
        imported: 0,
        failed: 1,
        errors: [{ row: 0, email: undefined, error: error.message || "Invalid JSON format" }],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Export handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = await customersApi.exportCustomersCSV(
        selectedStatus() !== "all" ? (selectedStatus() as "active" | "inactive") : undefined
      );

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
          <h3 class={styles.statTitle}>Business Customers</h3>
          <p class={styles.statValueInfo}>{getBusinessCustomers()}</p>
        </div>
        <div class={styles.statCard}>
          <h3 class={styles.statTitle}>Total Revenue</h3>
          <p class={styles.statValueWarning}>{formatCurrency(getTotalRevenue())}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div class={styles.filterCard}>
        <div class={styles.filterGrid}>
          <div>
            <label class={styles.filterLabel}>Search Customers</label>
            <input
              type="text"
              placeholder="Search by name, email, phone, or company..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class={styles.filterInput}
            />
          </div>
          <div>
            <label class={styles.filterLabel}>Status</label>
            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.currentTarget.value)}
              class={styles.filterInput}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label class={styles.filterLabel}>Customer Type</label>
            <select
              value={selectedType()}
              onChange={(e) => setSelectedType(e.currentTarget.value)}
              class={styles.filterInput}
            >
              <option value="all">All Types</option>
              <option value="business">Business</option>
              <option value="individual">Individual</option>
            </select>
          </div>
          <div class={styles.filterButtonWrapper}>
            <div class={styles.actionButtonsGroup}>
              <button class={styles.secondaryButton} onClick={handleOpenImport}>
                Import
              </button>
              <button
                class={styles.secondaryButton}
                onClick={handleExport}
                disabled={isExporting()}
              >
                {isExporting() ? "Exporting..." : "Export CSV"}
              </button>
              <button class={styles.addButton} onClick={handleAddCustomer}>
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class={styles.mainGrid}>
        {/* Customer List */}
        <div>
          <div class={styles.listCard}>
            <div class={styles.listHeader}>
              <h2 class={styles.listTitle}>Customers ({filteredCustomers().length})</h2>
            </div>

            <Show
              when={!customersData.loading}
              fallback={
                <div class={styles.loadingContainer}>
                  <div class={styles.spinner}></div>
                </div>
              }
            >
              <Show
                when={filteredCustomers().length > 0}
                fallback={
                  <div class={styles.emptyState}>No customers found matching your criteria.</div>
                }
              >
                <div class={styles.customerList}>
                  <For each={filteredCustomers()}>
                    {(customer) => (
                      <div
                        class={styles.customerItem}
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <div class={styles.customerItemContent}>
                          <div class={styles.customerInfo}>
                            <div class={styles.customerNameRow}>
                              <h3 class={styles.customerName}>{customer.name}</h3>
                              <Badge
                                variant={customer.status === "active" ? "success" : "secondary"}
                                size="sm"
                              >
                                {customer.status === "active" ? "Active" : "Inactive"}
                              </Badge>
                              <Badge
                                color={customer.customerType === "business" ? "blue" : "gray"}
                                size="sm"
                              >
                                {customer.customerType === "business" ? "Business" : "Individual"}
                              </Badge>
                            </div>

                            <div class={styles.customerContact}>
                              <Show when={customer.companyName}>
                                <p class={styles.companyName}>{customer.companyName}</p>
                              </Show>
                              <p>{customer.email || "No email"}</p>
                              <p>{customer.phone}</p>
                            </div>

                            <div class={styles.customerStatsGrid}>
                              <div>
                                <span class={styles.statLabel}>Orders:</span> {customer.totalOrders}
                              </div>
                              <div>
                                <span class={styles.statLabel}>Spent:</span>{" "}
                                {formatCurrency(customer.totalSpent)}
                              </div>
                              <div>
                                <span class={styles.statLabel}>Points:</span>{" "}
                                {customer.loyaltyPoints}
                              </div>
                            </div>
                          </div>

                          <div class={styles.customerActions}>
                            <button
                              class={styles.actionLink}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustomer(customer);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              class={styles.actionLinkSecondary}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCustomer(customer);
                              }}
                            >
                              View
                            </button>
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

        {/* Customer Detail Sidebar */}
        <div>
          <Show
            when={selectedCustomer()}
            fallback={
              <div class={styles.detailEmpty}>Select a customer to view details</div>
            }
          >
            {(customer) => (
              <div class={styles.detailCard}>
                <div class={styles.detailHeader}>
                  <h2 class={styles.detailName}>{customer().name}</h2>
                  <Show when={customer().companyName}>
                    <p class={styles.detailCompany}>{customer().companyName}</p>
                  </Show>
                  <p class={styles.detailEmail}>{customer().email || "No email"}</p>
                  <div class={styles.detailBadges}>
                    <Badge variant={customer().status === "active" ? "success" : "secondary"}>
                      {customer().status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <Badge color={customer().customerType === "business" ? "blue" : "gray"}>
                      {customer().customerType === "business" ? "Business" : "Individual"}
                    </Badge>
                  </div>
                </div>

                <div class={styles.detailContent}>
                  {/* Contact Information */}
                  <div class={styles.detailSection}>
                    <h3 class={styles.sectionTitle}>Contact Information</h3>
                    <div class={styles.detailRow}>
                      <div>
                        <span class={styles.detailLabel}>Phone:</span>{" "}
                        <span class={styles.detailValue}>{customer().phone}</span>
                      </div>
                      <Show when={customer().addressLine1}>
                        <div>
                          <span class={styles.detailLabel}>Address:</span>
                          <div class={styles.addressBlock}>
                            {customer().addressLine1}
                            <Show when={customer().addressLine2}>
                              <br />
                              {customer().addressLine2}
                            </Show>
                            <Show
                              when={customer().city || customer().state || customer().zipCode}
                            >
                              <br />
                              {[customer().city, customer().state, customer().zipCode]
                                .filter(Boolean)
                                .join(", ")}
                            </Show>
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
                        <div class={styles.orderStatValuePrimary}>{customer().totalOrders}</div>
                      </div>
                      <div>
                        <span class={styles.orderStatLabel}>Total Spent:</span>
                        <div class={styles.orderStatValueSuccess}>
                          {formatCurrency(customer().totalSpent)}
                        </div>
                      </div>
                      <div>
                        <span class={styles.orderStatLabel}>Avg Order:</span>
                        <div class={styles.orderStatValueInfo}>
                          {formatCurrency(customer().averageOrderValue)}
                        </div>
                      </div>
                      <div>
                        <span class={styles.orderStatLabel}>Last Order:</span>
                        <div class={styles.lastOrderValue}>
                          {customer().lastOrderAt
                            ? new Date(customer().lastOrderAt!).toLocaleDateString()
                            : "Never"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty Information */}
                  <div class={styles.detailSection}>
                    <h3 class={styles.sectionTitle}>Loyalty Program</h3>
                    <div class={styles.loyaltyRow}>
                      <span class={styles.loyaltyLabel}>Points:</span>
                      <span class={styles.loyaltyPoints}>{customer().loyaltyPoints}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <Show when={customer().notes}>
                    <div class={styles.detailSection}>
                      <h3 class={styles.sectionTitle}>Notes</h3>
                      <p class={styles.notesText}>{customer().notes}</p>
                    </div>
                  </Show>

                  <div class={styles.detailActions}>
                    <button
                      class={styles.viewOrdersButton}
                      onClick={() => handleViewCustomer(customer())}
                    >
                      View Full Details
                    </button>
                    <button
                      class={styles.editButton}
                      onClick={() => handleEditCustomer(customer())}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>

      {/* Modals */}
      <CustomerFormModal
        isOpen={isFormModalOpen()}
        customer={editingCustomer()}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      <CustomerDetailsModal
        isOpen={isDetailsModalOpen()}
        customer={selectedCustomer()}
        onClose={handleDetailsClose}
        onEdit={handleDetailsEdit}
      />

      {/* Import Modal */}
      <Show when={isImportModalOpen()}>
        <div class={styles.importModal}>
          <div class={styles.importModalBackdrop} onClick={handleCloseImport} />
          <div class={styles.importModalContent}>
            <h2 class={styles.importModalTitle}>Import Customers</h2>
            <textarea
              class={styles.importTextarea}
              placeholder='Paste JSON array of customers, e.g.:
[
  {"name": "John Doe", "phone": "555-1234", "email": "john@example.com"},
  {"name": "Jane Smith", "phone": "555-5678", "customerType": "business", "companyName": "ABC Corp"}
]'
              value={importData()}
              onInput={(e) => setImportData(e.currentTarget.value)}
            />
            <p class={styles.importHelp}>
              Required fields: name, phone. Optional: email, addressLine1, addressLine2, city,
              state, zipCode, customerType (business/individual), companyName, taxId,
              preferredContact (email/phone/text), marketingOptIn, notes.
            </p>

            <Show when={importResult()}>
              {(result) => (
                <div class={styles.importResults}>
                  <Show when={result().imported > 0}>
                    <p class={styles.importResultSuccess}>
                      Successfully imported {result().imported} customer(s)
                    </p>
                  </Show>
                  <Show when={result().failed > 0}>
                    <p class={styles.importResultError}>
                      Failed to import {result().failed} customer(s)
                    </p>
                    <div class={styles.importErrorList}>
                      <For each={result().errors}>
                        {(error) => (
                          <p class={styles.importErrorItem}>
                            Row {error.row}: {error.error}
                          </p>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              )}
            </Show>

            <div class={styles.importModalActions}>
              <button class={styles.secondaryButton} onClick={handleCloseImport}>
                Cancel
              </button>
              <button
                class={styles.addButton}
                onClick={handleImport}
                disabled={isImporting() || !importData().trim()}
              >
                {isImporting() ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default CustomersPage;
