import { Component, createSignal, Show, For, onMount, createEffect, createMemo } from 'solid-js';
import {
  InternalOrder,
  InternalOrderPriority,
  InternalOrderSource,
  CreateInternalOrderRequest
} from '~/api/internalOrders';
import { productsApi, Product } from '~/api/products';
import { useAuth } from '~/context/AuthContext';
import { getTomorrowDateString, getCurrentDateString } from '~/utils/dateUtils';

// Common components
import { Modal, ModalHeader, ModalBody, ModalFooter } from '~/components/common/Modal';
import { FormRow, FormStack } from '~/components/common/FormRow';
import { StepIndicator } from '~/components/common/StepIndicator';
import {
  Card,
  CardTitle,
  SummaryRow,
  SummaryStack,
  ListItem,
  SelectedItem,
  QuantityControl,
  QuantityValue,
  ScrollableList,
  SectionTitle,
  ItemStack,
  ButtonGroup,
} from '~/components/common/Card';
import Button from '~/components/common/Button';
import TextField from '~/components/common/TextField';
import TextArea from '~/components/common/TextArea';
import Select from '~/components/common/Select';
import DatePicker from '~/components/common/DatePicker';

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
  unitCost: string;
}

const InternalOrderFormModal: Component<InternalOrderFormModalProps> = (props) => {
  const auth = useAuth();
  const [currentStep, setCurrentStep] = createSignal(1);
  const [loading, setLoading] = createSignal(false);
  const [products, setProducts] = createSignal<Product[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');

  // User-derived values
  const userFullName = createMemo(() => {
    const user = auth.user;
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  });

  const userAreas = createMemo(() => {
    const user = auth.user;
    return user?.areas || [];
  });

  const hasMultipleAreas = createMemo(() => userAreas().length > 1);

  // Form fields
  const [orderNumber, setOrderNumber] = createSignal('');
  const [source, setSource] = createSignal<InternalOrderSource>('cafe');
  const [priority, setPriority] = createSignal<InternalOrderPriority>('normal');
  const [requestedBy, setRequestedBy] = createSignal('');
  const [neededByDate, setNeededByDate] = createSignal('');
  const [batchNumber, setBatchNumber] = createSignal('');
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
        setOrderNumber(props.editOrder.orderNumber);
        setSource(props.editOrder.source);
        setPriority(props.editOrder.priority);
        setRequestedBy(props.editOrder.requestedBy);
        setNeededByDate(props.editOrder.neededByDate?.split('T')[0] || '');
        setBatchNumber(props.editOrder.batchNumber || '');
        setNotes(props.editOrder.notes || '');
        setItems(props.editOrder.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost || '0',
        })));
      } else {
        const timestamp = Date.now();
        const areas = userAreas();

        setOrderNumber(`IO-${timestamp}`);
        setSource(areas.length > 0 ? areas[0] as InternalOrderSource : 'cafe');
        setPriority('normal');
        setRequestedBy(userFullName());
        setNeededByDate(getTomorrowDateString());
        setBatchNumber(`BATCH-${timestamp}`);
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
        unitCost: product.basePrice.toString(),
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
      return sum + (parseFloat(item.unitCost) * item.quantity);
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

    const total = calculateTotal();
    const orderData: CreateInternalOrderRequest = {
      orderNumber: orderNumber(),
      source: source(),
      status: props.editOrder ? props.editOrder.status : 'draft',
      priority: priority(),
      requestedBy: requestedBy(),
      totalCost: total.toFixed(2),
      neededByDate: new Date(neededByDate()).toISOString(),
      batchNumber: batchNumber() || undefined,
      notes: notes() || undefined,
      items: items().map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
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
    if (currentStep() < 3) setCurrentStep(currentStep() + 1);
  };

  const prevStep = () => {
    if (currentStep() > 1) setCurrentStep(currentStep() - 1);
  };

  const formatSourceLabel = (area: string) => {
    return area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Modal isOpen={props.show} onClose={handleClose} size="lg">
      <ModalHeader
        title={`${props.editOrder ? 'Edit' : 'Create'} Internal Production Order`}
        onClose={handleClose}
      >
        <StepIndicator totalSteps={3} currentStep={currentStep()} />
      </ModalHeader>

      <ModalBody>
        {/* Step 1: Basic Info */}
        <Show when={currentStep() === 1}>
          <FormStack>
            <TextField
              label="Order Number"
              type="text"
              value={orderNumber()}
              disabled
            />

            <FormRow cols={2}>
              <Show
                when={hasMultipleAreas()}
                fallback={
                  <TextField
                    label="Source"
                    type="text"
                    value={formatSourceLabel(source())}
                    disabled
                  />
                }
              >
                <Select
                  label="Source"
                  value={source()}
                  onInput={(e) => setSource(e.currentTarget.value as InternalOrderSource)}
                >
                  <For each={userAreas()}>
                    {(area) => (
                      <option value={area}>{formatSourceLabel(area)}</option>
                    )}
                  </For>
                </Select>
              </Show>

              <TextField
                label="Requested By"
                type="text"
                value={requestedBy()}
                disabled
              />
            </FormRow>

            <FormRow cols={2}>
              <Select
                label="Priority"
                value={priority()}
                onInput={(e) => setPriority(e.currentTarget.value as InternalOrderPriority)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="rush">Rush</option>
              </Select>

              <DatePicker
                label="Needed By Date *"
                value={neededByDate()}
                onChange={(value) => setNeededByDate(value)}
                placeholder="When is it needed"
                minDate={getCurrentDateString()}
              />
            </FormRow>
          </FormStack>
        </Show>

        {/* Step 2: Products */}
        <Show when={currentStep() === 2}>
          <FormStack>
            <TextField
              label="Search Products"
              type="text"
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Search by name or category..."
            />

            <ScrollableList>
              <For each={filteredProducts()}>
                {(product) => (
                  <ListItem
                    title={product.name}
                    subtitle={`${product.category} - $${product.basePrice}`}
                    onClick={() => addProduct(product)}
                    action={<Button variant="primary" size="sm">Add</Button>}
                  />
                )}
              </For>
            </ScrollableList>

            <div>
              <SectionTitle>Selected Products ({items().length})</SectionTitle>
              <ItemStack>
                <For each={items()}>
                  {(item) => (
                    <SelectedItem
                      title={item.productName}
                      subtitle={`$${item.unitCost} each`}
                    >
                      <QuantityControl>
                        <Button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          variant="secondary"
                          size="sm"
                        >
                          -
                        </Button>
                        <QuantityValue value={item.quantity} />
                        <Button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          variant="secondary"
                          size="sm"
                        >
                          +
                        </Button>
                      </QuantityControl>
                      <Button
                        onClick={() => removeProduct(item.productId)}
                        variant="danger"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </SelectedItem>
                  )}
                </For>
              </ItemStack>
            </div>
          </FormStack>
        </Show>

        {/* Step 3: Order Details */}
        <Show when={currentStep() === 3}>
          <FormStack>
            <FormRow cols={2}>
              <TextField
                label="Order Number"
                type="text"
                value={orderNumber()}
                disabled
              />
              <TextField
                label="Batch Number"
                type="text"
                value={batchNumber()}
                disabled
              />
            </FormRow>

            <TextArea
              label="Notes"
              value={notes()}
              onInput={(e) => setNotes(e.currentTarget.value)}
              placeholder="Additional production notes..."
              rows={4}
            />

            <Card variant="secondary">
              <CardTitle>Order Summary</CardTitle>
              <SummaryStack>
                <SummaryRow
                  label="Total Items:"
                  value={items().reduce((sum, item) => sum + item.quantity, 0)}
                />
                <SummaryRow
                  label="Estimated Cost:"
                  value={`$${calculateTotal().toFixed(2)}`}
                />
              </SummaryStack>
            </Card>
          </FormStack>
        </Show>
      </ModalBody>

      <ModalFooter spaceBetween>
        <Button
          onClick={prevStep}
          disabled={currentStep() === 1}
          variant="secondary"
          size="sm"
        >
          Previous
        </Button>

        <ButtonGroup>
          <Button onClick={handleClose} variant="secondary" size="sm">
            Cancel
          </Button>

          <Show
            when={currentStep() === 3}
            fallback={
              <Button onClick={nextStep} variant="primary" size="sm">
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
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};

export default InternalOrderFormModal;
