import { Component, createSignal, Show, For, onMount, createEffect } from 'solid-js';
import {
  InternalOrder,
  InternalOrderPriority,
  InternalOrderSource,
  CreateInternalOrderRequest
} from '~/api/internalOrders';
import { productsApi, Product } from '~/api/products';
import DatePicker from '~/components/common/DatePicker';
import Button from '~/components/common/Button';

type ProductionShift = 'morning' | 'afternoon' | 'night';

interface InternalOrderFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (order: CreateInternalOrderRequest) => Promise<void>;
  editOrder?: InternalOrder;
}

interface OrderItemForm {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

const InternalOrderFormModal: Component<InternalOrderFormModalProps> = (props) => {
  const [currentStep, setCurrentStep] = createSignal(1);
  const [loading, setLoading] = createSignal(false);
  const [products, setProducts] = createSignal<Product[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');

  // Form fields
  const [orderNumber, setOrderNumber] = createSignal('');
  const [source, setSource] = createSignal<InternalOrderSource>('cafe');
  const [priority, setPriority] = createSignal<InternalOrderPriority>('normal');
  const [requestedBy, setRequestedBy] = createSignal('');
  const [department, setDepartment] = createSignal('');
  const [requestedDate, setRequestedDate] = createSignal('');
  const [neededByDate, setNeededByDate] = createSignal('');
  const [productionDate, setProductionDate] = createSignal('');
  const [productionShift, setProductionShift] = createSignal<ProductionShift>('morning');
  const [assignedStaff, setAssignedStaff] = createSignal('');
  const [workstation, setWorkstation] = createSignal('');
  const [batchNumber, setBatchNumber] = createSignal('');
  const [targetQuantity, setTargetQuantity] = createSignal<number>(0);
  const [notes, setNotes] = createSignal('');
  const [items, setItems] = createSignal<OrderItemForm[]>([]);

  // Load products once on mount
  onMount(async () => {
    try {
      const allProducts = await productsApi.getActiveProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  });

  // Populate form when editOrder changes or modal opens
  createEffect(() => {
    if (props.show) {
      if (props.editOrder) {
        // Populate with existing order data
        setOrderNumber(props.editOrder.orderNumber);
        setSource(props.editOrder.source);
        setPriority(props.editOrder.priority);
        setRequestedBy(props.editOrder.requestedBy);
        setDepartment(props.editOrder.department);
        setRequestedDate(props.editOrder.requestedDate?.split('T')[0] || '');
        setNeededByDate(props.editOrder.neededByDate?.split('T')[0] || '');
        setProductionDate(props.editOrder.productionDate?.split('T')[0] || '');
        setProductionShift(props.editOrder.productionShift || 'morning');
        setAssignedStaff(props.editOrder.assignedStaff || '');
        setWorkstation(props.editOrder.workstation || '');
        setBatchNumber(props.editOrder.batchNumber || '');
        setTargetQuantity(props.editOrder.targetQuantity || 0);
        setNotes(props.editOrder.notes || '');
        setItems(props.editOrder.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })));
      } else {
        // Reset for new order
        const timestamp = Date.now();
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        setOrderNumber(`IO-${timestamp}`);
        setSource('cafe');
        setPriority('normal');
        setRequestedBy('');
        setDepartment('');
        setRequestedDate(today);
        setNeededByDate(tomorrow);
        setProductionDate('');
        setProductionShift('morning');
        setAssignedStaff('');
        setWorkstation('');
        setBatchNumber(`BATCH-${timestamp}`);
        setTargetQuantity(0);
        setNotes('');
        setItems([]);
        setCurrentStep(1);
      }
    }
  });

  const filteredProducts = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return products();
    return products().filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  };

  const addProduct = (product: Product) => {
    const existing = items().find(i => i.productId === product.id);
    if (existing) {
      setItems(items().map(i =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items(), {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.basePrice.toString(),
      }]);
    }
  };

  const removeProduct = (productId: string) => {
    setItems(items().filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(items().map(i =>
      i.productId === productId ? { ...i, quantity } : i
    ));
  };

  const calculateTotal = () => {
    return items().reduce((sum, item) => {
      return sum + (parseFloat(item.unitPrice) * item.quantity);
    }, 0);
  };

  const handleSubmit = async () => {
    if (items().length === 0) {
      alert('Please add at least one product');
      return;
    }

    if (!requestedBy()) {
      alert('Please enter who is requesting this order');
      return;
    }

    if (!department()) {
      alert('Please enter the department');
      return;
    }

    const total = calculateTotal();
    const orderData: CreateInternalOrderRequest = {
      orderNumber: orderNumber(),
      source: source(),
      status: props.editOrder ? props.editOrder.status : 'draft',
      priority: priority(),
      requestedBy: requestedBy(),
      department: department(),
      totalCost: total.toFixed(2),
      requestedDate: new Date(requestedDate()).toISOString(),
      neededByDate: new Date(neededByDate()).toISOString(),
      productionDate: productionDate() ? new Date(productionDate()).toISOString() : undefined,
      productionShift: productionShift() || undefined,
      assignedStaff: assignedStaff() || undefined,
      workstation: workstation() || undefined,
      batchNumber: batchNumber() || undefined,
      targetQuantity: targetQuantity() || undefined,
      notes: notes() || undefined,
      items: items().map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitPrice,
      })),
    };

    setLoading(true);
    try {
      await props.onSubmit(orderData);
      handleClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setItems([]);
    setSearchQuery('');
    props.onClose();
  };

  const nextStep = () => {
    if (currentStep() < 3) {
      setCurrentStep(currentStep() + 1);
    }
  };

  const prevStep = () => {
    if (currentStep() > 1) {
      setCurrentStep(currentStep() - 1);
    }
  };

  return (
    <Show when={props.show}>
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          'z-index': '9999',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: '1rem',
          'background-color': 'var(--overlay-bg)',
          'overflow-y': 'auto',
        }}
        onClick={handleClose}
      >
        <div
          style={{
            'background-color': 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            'border-radius': '0.5rem',
            'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '100%',
            'max-width': '900px',
            'max-height': '90vh',
            display: 'flex',
            'flex-direction': 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            'border-bottom': '1px solid var(--border-color)',
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
          }}>
            <div>
              <h2 style={{
                'font-size': '1.5rem',
                'font-weight': '600',
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem 0',
              }}>
                {props.editOrder ? 'Edit' : 'Create'} Internal Production Order
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', 'margin-top': '1rem' }}>
                <For each={[1, 2, 3]}>
                  {(step) => (
                    <div style={{
                      flex: '1',
                      height: '4px',
                      'background-color': step <= currentStep()
                        ? 'var(--primary-color)'
                        : 'var(--border-color)',
                      'border-radius': '2px',
                    }} />
                  )}
                </For>
              </div>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              class="p-1"
            >
              ×
            </Button>
          </div>

          {/* Content */}
          <div style={{
            padding: '1.5rem',
            'overflow-y': 'auto',
            flex: '1',
          }}>
            {/* Step 1: Basic Info */}
            <Show when={currentStep() === 1}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    'margin-bottom': '0.5rem',
                    'font-weight': '500',
                    color: 'var(--text-primary)',
                  }}>
                    Order Number *
                  </label>
                  <input
                    type="text"
                    value={orderNumber()}
                    onInput={(e) => setOrderNumber(e.currentTarget.value)}
                    disabled={!!props.editOrder}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      'border-radius': '0.375rem',
                      'background-color': props.editOrder ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Source Department *
                    </label>
                    <select
                      value={source()}
                      onInput={(e) => setSource(e.currentTarget.value as InternalOrderSource)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="cafe">Cafe</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="front_house">Front House</option>
                      <option value="catering">Catering</option>
                      <option value="retail">Retail</option>
                      <option value="events">Events</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Priority
                    </label>
                    <select
                      value={priority()}
                      onInput={(e) => setPriority(e.currentTarget.value as InternalOrderPriority)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="rush">Rush</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Requested By *
                    </label>
                    <input
                      type="text"
                      value={requestedBy()}
                      onInput={(e) => setRequestedBy(e.currentTarget.value)}
                      placeholder="Name of person requesting"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Department *
                    </label>
                    <input
                      type="text"
                      value={department()}
                      onInput={(e) => setDepartment(e.currentTarget.value)}
                      placeholder="Department name"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <DatePicker
                      label="Requested Date *"
                      value={requestedDate()}
                      onChange={(value) => setRequestedDate(value)}
                      placeholder="When was this requested"
                    />
                  </div>

                  <div>
                    <DatePicker
                      label="Needed By Date *"
                      value={neededByDate()}
                      onChange={(value) => setNeededByDate(value)}
                      placeholder="When is it needed"
                      minDate={requestedDate() || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <DatePicker
                      label="Production Date"
                      value={productionDate()}
                      onChange={(value) => setProductionDate(value)}
                      placeholder="Select production date"
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Production Shift
                    </label>
                    <select
                      value={productionShift()}
                      onInput={(e) => setProductionShift(e.currentTarget.value as ProductionShift)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="night">Night</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Assigned Staff
                    </label>
                    <input
                      type="text"
                      value={assignedStaff()}
                      onInput={(e) => setAssignedStaff(e.currentTarget.value)}
                      placeholder="Staff member name"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Show>

            {/* Step 2: Products */}
            <Show when={currentStep() === 2}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    'margin-bottom': '0.5rem',
                    'font-weight': '500',
                    color: 'var(--text-primary)',
                  }}>
                    Search Products
                  </label>
                  <input
                    type="text"
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    placeholder="Search by name or category..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      'border-radius': '0.375rem',
                      'background-color': 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div style={{
                  'max-height': '200px',
                  'overflow-y': 'auto',
                  border: '1px solid var(--border-color)',
                  'border-radius': '0.375rem',
                }}>
                  <For each={filteredProducts()}>
                    {(product) => (
                      <div
                        onClick={() => addProduct(product)}
                        style={{
                          padding: '0.75rem',
                          'border-bottom': '1px solid var(--border-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'center',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <div style={{ 'font-weight': '500', color: 'var(--text-primary)' }}>
                            {product.name}
                          </div>
                          <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)' }}>
                            {product.category} - ${product.basePrice}
                          </div>
                        </div>
                        <Button variant="primary" size="sm">
                          Add
                        </Button>
                      </div>
                    )}
                  </For>
                </div>

                <div>
                  <h3 style={{
                    'font-weight': '500',
                    color: 'var(--text-primary)',
                    'margin-bottom': '1rem',
                  }}>
                    Selected Products ({items().length})
                  </h3>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}>
                    <For each={items()}>
                      {(item) => (
                        <div style={{
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          'border-radius': '0.375rem',
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'center',
                        }}>
                          <div style={{ flex: '1' }}>
                            <div style={{ 'font-weight': '500', color: 'var(--text-primary)' }}>
                              {item.productName}
                            </div>
                            <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)' }}>
                              ${item.unitPrice} each
                            </div>
                          </div>
                          <div style={{ display: 'flex', 'align-items': 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', 'align-items': 'center', gap: '0.5rem' }}>
                              <Button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                variant="secondary"
                                size="sm"
                              >
                                -
                              </Button>
                              <span style={{ 'min-width': '2rem', 'text-align': 'center', color: 'var(--text-primary)' }}>
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                variant="secondary"
                                size="sm"
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              onClick={() => removeProduct(item.productId)}
                              variant="danger"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Show>

            {/* Step 3: Production Details */}
            <Show when={currentStep() === 3}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={batchNumber()}
                      onInput={(e) => setBatchNumber(e.currentTarget.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      'margin-bottom': '0.5rem',
                      'font-weight': '500',
                      color: 'var(--text-primary)',
                    }}>
                      Workstation
                    </label>
                    <input
                      type="text"
                      value={workstation()}
                      onInput={(e) => setWorkstation(e.currentTarget.value)}
                      placeholder="e.g., Oven 1, Station A"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        'border-radius': '0.375rem',
                        'background-color': 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    'margin-bottom': '0.5rem',
                    'font-weight': '500',
                    color: 'var(--text-primary)',
                  }}>
                    Target Quantity
                  </label>
                  <input
                    type="number"
                    value={targetQuantity()}
                    onInput={(e) => setTargetQuantity(parseInt(e.currentTarget.value) || 0)}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      'border-radius': '0.375rem',
                      'background-color': 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    'margin-bottom': '0.5rem',
                    'font-weight': '500',
                    color: 'var(--text-primary)',
                  }}>
                    Notes
                  </label>
                  <textarea
                    value={notes()}
                    onInput={(e) => setNotes(e.currentTarget.value)}
                    placeholder="Additional production notes..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      'border-radius': '0.375rem',
                      'background-color': 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Order Summary */}
                <div style={{
                  padding: '1rem',
                  'background-color': 'var(--bg-secondary)',
                  'border-radius': '0.375rem',
                  border: '1px solid var(--border-color)',
                }}>
                  <h3 style={{
                    'font-weight': '500',
                    color: 'var(--text-primary)',
                    'margin-bottom': '0.75rem',
                  }}>
                    Order Summary
                  </h3>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Items:</span>
                      <span style={{ color: 'var(--text-primary)', 'font-weight': '500' }}>
                        {items().reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Estimated Cost:</span>
                      <span style={{ color: 'var(--text-primary)', 'font-weight': '500' }}>
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem',
            'border-top': '1px solid var(--border-color)',
            display: 'flex',
            'justify-content': 'space-between',
            gap: '1rem',
          }}>
            <Button
              onClick={prevStep}
              disabled={currentStep() === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                onClick={handleClose}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>

              <Show
                when={currentStep() === 3}
                fallback={
                  <Button
                    onClick={nextStep}
                    variant="primary"
                    size="sm"
                  >
                    Next
                  </Button>
                }
              >
                <Button
                  onClick={handleSubmit}
                  disabled={loading()}
                  variant="primary"
                  size="sm"
                >
                  {loading() ? 'Submitting...' : props.editOrder ? 'Update Order' : 'Create Order'}
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default InternalOrderFormModal;
