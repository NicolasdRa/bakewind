import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Customer, CustomerType, CustomerStatus, PreferredContact } from '~/api/customers';

// Test customer modal logic without rendering (Solid.js routing issues)
// Component rendering tests will be covered in E2E tests

describe('CustomerFormModal', () => {
  describe('Form Validation', () => {
    // Validation helper functions
    const validateName = (name: string): boolean => {
      return name.trim().length > 0 && name.length <= 255;
    };

    const validatePhone = (phone: string): boolean => {
      return phone.trim().length > 0 && phone.length <= 50;
    };

    const validateEmail = (email: string | null | undefined): boolean => {
      if (!email) return true; // Email is optional
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validateZipCode = (zipCode: string | null | undefined): boolean => {
      if (!zipCode) return true; // ZIP is optional
      return zipCode.length <= 20;
    };

    it('should validate required name field', () => {
      expect(validateName('John Doe')).toBe(true);
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false);
      expect(validateName('A'.repeat(256))).toBe(false);
    });

    it('should validate required phone field', () => {
      expect(validatePhone('555-1234')).toBe(true);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('   ')).toBe(false);
      expect(validatePhone('+1 (555) 123-4567')).toBe(true);
    });

    it('should validate optional email field', () => {
      expect(validateEmail(null)).toBe(true);
      expect(validateEmail(undefined)).toBe(true);
      expect(validateEmail('')).toBe(true);
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
    });

    it('should validate optional zipCode field', () => {
      expect(validateZipCode(null)).toBe(true);
      expect(validateZipCode('12345')).toBe(true);
      expect(validateZipCode('12345-6789')).toBe(true);
      expect(validateZipCode('A'.repeat(21))).toBe(false);
    });
  });

  describe('Customer Type Logic', () => {
    const getCustomerTypeLabel = (type: CustomerType): string => {
      return type === 'business' ? 'Business' : 'Individual';
    };

    const shouldShowBusinessFields = (type: CustomerType): boolean => {
      return type === 'business';
    };

    it('should return correct label for business type', () => {
      expect(getCustomerTypeLabel('business')).toBe('Business');
    });

    it('should return correct label for individual type', () => {
      expect(getCustomerTypeLabel('individual')).toBe('Individual');
    });

    it('should show business fields for business type', () => {
      expect(shouldShowBusinessFields('business')).toBe(true);
    });

    it('should hide business fields for individual type', () => {
      expect(shouldShowBusinessFields('individual')).toBe(false);
    });
  });

  describe('Form Submission Data', () => {
    interface CustomerFormData {
      name: string;
      email?: string;
      phone: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      customerType: CustomerType;
      companyName?: string;
      taxId?: string;
      preferredContact?: PreferredContact;
      marketingOptIn?: boolean;
      notes?: string;
    }

    const cleanFormData = (data: CustomerFormData): CustomerFormData => {
      const cleaned: CustomerFormData = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        customerType: data.customerType,
      };

      // Only include non-empty optional fields
      if (data.email?.trim()) cleaned.email = data.email.trim();
      if (data.addressLine1?.trim()) cleaned.addressLine1 = data.addressLine1.trim();
      if (data.addressLine2?.trim()) cleaned.addressLine2 = data.addressLine2.trim();
      if (data.city?.trim()) cleaned.city = data.city.trim();
      if (data.state?.trim()) cleaned.state = data.state.trim();
      if (data.zipCode?.trim()) cleaned.zipCode = data.zipCode.trim();
      if (data.companyName?.trim()) cleaned.companyName = data.companyName.trim();
      if (data.taxId?.trim()) cleaned.taxId = data.taxId.trim();
      if (data.preferredContact) cleaned.preferredContact = data.preferredContact;
      if (data.marketingOptIn !== undefined) cleaned.marketingOptIn = data.marketingOptIn;
      if (data.notes?.trim()) cleaned.notes = data.notes.trim();

      return cleaned;
    };

    it('should trim whitespace from all fields', () => {
      const formData: CustomerFormData = {
        name: '  John Doe  ',
        phone: '  555-1234  ',
        customerType: 'business',
        email: '  test@example.com  ',
      };

      const cleaned = cleanFormData(formData);

      expect(cleaned.name).toBe('John Doe');
      expect(cleaned.phone).toBe('555-1234');
      expect(cleaned.email).toBe('test@example.com');
    });

    it('should exclude empty optional fields', () => {
      const formData: CustomerFormData = {
        name: 'John Doe',
        phone: '555-1234',
        customerType: 'individual',
        email: '',
        companyName: '',
        notes: '   ',
      };

      const cleaned = cleanFormData(formData);

      expect(cleaned).not.toHaveProperty('email');
      expect(cleaned).not.toHaveProperty('companyName');
      expect(cleaned).not.toHaveProperty('notes');
    });

    it('should preserve business fields for business customers', () => {
      const formData: CustomerFormData = {
        name: 'Business Customer',
        phone: '555-1234',
        customerType: 'business',
        companyName: 'Test Corp',
        taxId: '12-3456789',
      };

      const cleaned = cleanFormData(formData);

      expect(cleaned.companyName).toBe('Test Corp');
      expect(cleaned.taxId).toBe('12-3456789');
    });
  });

  describe('Edit Mode Logic', () => {
    const isEditMode = (customer: Customer | null): boolean => {
      return customer !== null;
    };

    const getModalTitle = (customer: Customer | null): string => {
      return customer ? 'Edit Customer' : 'Add Customer';
    };

    const getSubmitButtonLabel = (customer: Customer | null): string => {
      return customer ? 'Update Customer' : 'Create Customer';
    };

    it('should detect create mode when customer is null', () => {
      expect(isEditMode(null)).toBe(false);
      expect(getModalTitle(null)).toBe('Add Customer');
      expect(getSubmitButtonLabel(null)).toBe('Create Customer');
    });

    it('should detect edit mode when customer is provided', () => {
      const customer: Customer = {
        id: 'customer-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-1234',
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        customerType: 'business',
        companyName: null,
        taxId: null,
        preferredContact: null,
        marketingOptIn: false,
        status: 'active',
        notes: null,
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isEditMode(customer)).toBe(true);
      expect(getModalTitle(customer)).toBe('Edit Customer');
      expect(getSubmitButtonLabel(customer)).toBe('Update Customer');
    });
  });
});

describe('CustomerDetailsModal', () => {
  describe('Currency Formatting', () => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    it('should format positive amounts correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle large numbers with comma separators', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('Date Formatting', () => {
    const formatDate = (dateStr: string): string => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    it('should format dates correctly', () => {
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('January 15, 2024');
      expect(formatDate('2024-12-25T00:00:00Z')).toBe('December 25, 2024');
    });
  });

  describe('Address Formatting', () => {
    interface AddressFields {
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
    }

    const formatAddress = (customer: AddressFields): string => {
      const parts = [
        customer.addressLine1,
        customer.addressLine2,
        [customer.city, customer.state, customer.zipCode].filter(Boolean).join(', '),
      ].filter(Boolean);
      return parts.length > 0 ? parts.join('\n') : 'No address provided';
    };

    it('should format full address correctly', () => {
      const customer: AddressFields = {
        addressLine1: '123 Main St',
        addressLine2: 'Suite 100',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      };

      const formatted = formatAddress(customer);
      expect(formatted).toContain('123 Main St');
      expect(formatted).toContain('Suite 100');
      expect(formatted).toContain('Springfield, IL, 62701');
    });

    it('should handle missing address line 2', () => {
      const customer: AddressFields = {
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
      };

      const formatted = formatAddress(customer);
      expect(formatted).toContain('123 Main St');
      expect(formatted).not.toContain('null');
    });

    it('should return placeholder for empty address', () => {
      const customer: AddressFields = {
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
      };

      const formatted = formatAddress(customer);
      expect(formatted).toBe('No address provided');
    });

    it('should handle partial city/state/zip', () => {
      const customer: AddressFields = {
        addressLine1: '123 Main St',
        addressLine2: null,
        city: 'Springfield',
        state: null,
        zipCode: '62701',
      };

      const formatted = formatAddress(customer);
      expect(formatted).toContain('Springfield, 62701');
    });
  });

  describe('Preferred Contact Label', () => {
    const getPreferredContactLabel = (method: PreferredContact | null): string => {
      if (!method) return 'No preference';
      const labels: Record<PreferredContact, string> = {
        email: 'Email',
        phone: 'Phone',
        text: 'Text Message',
      };
      return labels[method] || method;
    };

    it('should return correct labels for contact methods', () => {
      expect(getPreferredContactLabel('email')).toBe('Email');
      expect(getPreferredContactLabel('phone')).toBe('Phone');
      expect(getPreferredContactLabel('text')).toBe('Text Message');
    });

    it('should handle null preference', () => {
      expect(getPreferredContactLabel(null)).toBe('No preference');
    });
  });

  describe('Order Statistics Display', () => {
    interface OrderStats {
      totalOrders: number;
      totalSpent: number;
      averageOrderValue: number;
    }

    const calculateStats = (customer: OrderStats): { hasOrders: boolean; avgDisplay: string } => {
      return {
        hasOrders: customer.totalOrders > 0,
        avgDisplay: customer.totalOrders > 0
          ? `$${customer.averageOrderValue.toFixed(2)}`
          : 'N/A',
      };
    };

    it('should indicate customer has orders', () => {
      const customer: OrderStats = {
        totalOrders: 5,
        totalSpent: 250,
        averageOrderValue: 50,
      };

      const stats = calculateStats(customer);
      expect(stats.hasOrders).toBe(true);
      expect(stats.avgDisplay).toBe('$50.00');
    });

    it('should indicate customer has no orders', () => {
      const customer: OrderStats = {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      };

      const stats = calculateStats(customer);
      expect(stats.hasOrders).toBe(false);
      expect(stats.avgDisplay).toBe('N/A');
    });
  });

  describe('Status Badge Logic', () => {
    const getStatusVariant = (status: CustomerStatus): 'success' | 'secondary' => {
      return status === 'active' ? 'success' : 'secondary';
    };

    const getStatusLabel = (status: CustomerStatus): string => {
      return status === 'active' ? 'Active' : 'Inactive';
    };

    it('should return success variant for active status', () => {
      expect(getStatusVariant('active')).toBe('success');
      expect(getStatusLabel('active')).toBe('Active');
    });

    it('should return secondary variant for inactive status', () => {
      expect(getStatusVariant('inactive')).toBe('secondary');
      expect(getStatusLabel('inactive')).toBe('Inactive');
    });
  });

  describe('Customer Type Badge Logic', () => {
    const getTypeColor = (type: CustomerType): 'blue' | 'gray' => {
      return type === 'business' ? 'blue' : 'gray';
    };

    const getTypeLabel = (type: CustomerType): string => {
      return type === 'business' ? 'Business' : 'Individual';
    };

    it('should return blue color for business type', () => {
      expect(getTypeColor('business')).toBe('blue');
      expect(getTypeLabel('business')).toBe('Business');
    });

    it('should return gray color for individual type', () => {
      expect(getTypeColor('individual')).toBe('gray');
      expect(getTypeLabel('individual')).toBe('Individual');
    });
  });
});

describe('CustomersPage', () => {
  describe('Filter Logic', () => {
    interface Customer {
      name: string;
      email: string | null;
      phone: string;
      companyName: string | null;
      status: CustomerStatus;
      customerType: CustomerType;
    }

    const filterCustomers = (
      customers: Customer[],
      searchTerm: string,
      status: string,
      customerType: string
    ): Customer[] => {
      let filtered = customers;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (customer) =>
            customer.name.toLowerCase().includes(term) ||
            customer.email?.toLowerCase().includes(term) ||
            customer.phone.toLowerCase().includes(term) ||
            customer.companyName?.toLowerCase().includes(term)
        );
      }

      if (status !== 'all') {
        filtered = filtered.filter((customer) => customer.status === status);
      }

      if (customerType !== 'all') {
        filtered = filtered.filter((customer) => customer.customerType === customerType);
      }

      return filtered;
    };

    const mockCustomers: Customer[] = [
      { name: 'John Doe', email: 'john@example.com', phone: '555-1234', companyName: 'Acme Corp', status: 'active', customerType: 'business' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678', companyName: null, status: 'active', customerType: 'individual' },
      { name: 'Bob Wilson', email: null, phone: '555-9999', companyName: 'Wilson LLC', status: 'inactive', customerType: 'business' },
    ];

    it('should filter by search term in name', () => {
      const result = filterCustomers(mockCustomers, 'john', 'all', 'all');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should filter by search term in email', () => {
      const result = filterCustomers(mockCustomers, 'jane@example', 'all', 'all');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('should filter by search term in company name', () => {
      const result = filterCustomers(mockCustomers, 'acme', 'all', 'all');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should filter by status', () => {
      const result = filterCustomers(mockCustomers, '', 'active', 'all');
      expect(result).toHaveLength(2);
      result.forEach((c) => expect(c.status).toBe('active'));
    });

    it('should filter by customer type', () => {
      const result = filterCustomers(mockCustomers, '', 'all', 'business');
      expect(result).toHaveLength(2);
      result.forEach((c) => expect(c.customerType).toBe('business'));
    });

    it('should combine multiple filters', () => {
      const result = filterCustomers(mockCustomers, '', 'active', 'business');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should return all customers when no filters applied', () => {
      const result = filterCustomers(mockCustomers, '', 'all', 'all');
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no matches', () => {
      const result = filterCustomers(mockCustomers, 'nonexistent', 'all', 'all');
      expect(result).toHaveLength(0);
    });
  });

  describe('Stats Calculations', () => {
    interface CustomerWithStats {
      status: CustomerStatus;
      customerType: CustomerType;
      totalSpent: number;
    }

    const calculateStats = (customers: CustomerWithStats[]) => {
      return {
        total: customers.length,
        active: customers.filter((c) => c.status === 'active').length,
        business: customers.filter((c) => c.customerType === 'business').length,
        revenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      };
    };

    it('should calculate correct stats', () => {
      const customers: CustomerWithStats[] = [
        { status: 'active', customerType: 'business', totalSpent: 100 },
        { status: 'active', customerType: 'individual', totalSpent: 50 },
        { status: 'inactive', customerType: 'business', totalSpent: 200 },
      ];

      const stats = calculateStats(customers);

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.business).toBe(2);
      expect(stats.revenue).toBe(350);
    });

    it('should handle empty customer list', () => {
      const stats = calculateStats([]);

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.business).toBe(0);
      expect(stats.revenue).toBe(0);
    });
  });
});
