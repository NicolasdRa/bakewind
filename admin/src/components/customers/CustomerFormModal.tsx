import { Component, createSignal, createEffect, Show } from "solid-js";
import {
  customersApi,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerType,
  PreferredContact,
} from "~/api/customers";

// Common components
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal";
import { FormRow, FormStack } from "~/components/common/FormRow";
import { SectionTitle, ButtonGroup } from "~/components/common/Card";
import Alert from "~/components/common/Alert";
import Button from "../common/Button";
import TextField from "../common/TextField";
import TextArea from "../common/TextArea";
import Select from "../common/Select";
import Checkbox from "../common/Checkbox";

interface CustomerFormModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  customerType: CustomerType;
  companyName: string;
  taxId: string;
  preferredContact: PreferredContact | "";
  marketingOptIn: boolean;
  notes: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  customerType: "business",
  companyName: "",
  taxId: "",
  preferredContact: "",
  marketingOptIn: false,
  notes: "",
};

const CustomerFormModal: Component<CustomerFormModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal<FormData>(initialFormData);

  // Derive mode from whether customer is provided
  const isEditMode = () => props.customer !== null;

  // Reset/populate form when modal opens or customer changes
  createEffect(() => {
    if (props.isOpen) {
      if (isEditMode() && props.customer) {
        setFormData({
          name: props.customer.name,
          email: props.customer.email || "",
          phone: props.customer.phone,
          addressLine1: props.customer.addressLine1 || "",
          addressLine2: props.customer.addressLine2 || "",
          city: props.customer.city || "",
          state: props.customer.state || "",
          zipCode: props.customer.zipCode || "",
          customerType: props.customer.customerType,
          companyName: props.customer.companyName || "",
          taxId: props.customer.taxId || "",
          preferredContact: props.customer.preferredContact || "",
          marketingOptIn: props.customer.marketingOptIn,
          notes: props.customer.notes || "",
        });
      } else {
        setFormData(initialFormData);
      }
      setError(null);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = formData();

      if (!isEditMode()) {
        const createData: CreateCustomerDto = {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zipCode: data.zipCode || undefined,
          customerType: data.customerType,
          companyName: data.companyName || undefined,
          taxId: data.taxId || undefined,
          preferredContact: data.preferredContact || undefined,
          marketingOptIn: data.marketingOptIn,
          notes: data.notes || undefined,
        };
        await customersApi.createCustomer(createData);
      } else if (props.customer) {
        const updateData: UpdateCustomerDto = {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          customerType: data.customerType,
          companyName: data.companyName || null,
          taxId: data.taxId || null,
          preferredContact: data.preferredContact || null,
          marketingOptIn: data.marketingOptIn,
          notes: data.notes || null,
        };
        await customersApi.updateCustomer(props.customer.id, updateData);
      }

      props.onSuccess();
      props.onClose();
    } catch (err: any) {
      setError(err?.data?.message || `Failed to ${isEditMode() ? "update" : "create"} customer`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} size="lg">
      <ModalHeader
        title={isEditMode() ? "Edit Customer" : "Add Customer"}
        onClose={props.onClose}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormStack>
            <Show when={error()}>
              <Alert variant="error">{error()}</Alert>
            </Show>

            {/* Customer Type */}
            <Select
              label="Customer Type *"
              required
              value={formData().customerType}
              onChange={(e) => updateField("customerType", e.currentTarget.value as CustomerType)}
            >
              <option value="business">Business</option>
              <option value="individual">Individual</option>
            </Select>

            {/* Business Info (conditional) */}
            <Show when={formData().customerType === "business"}>
              <FormRow cols={2}>
                <TextField
                  label="Company Name"
                  type="text"
                  value={formData().companyName}
                  onInput={(e) => updateField("companyName", e.currentTarget.value)}
                  placeholder="Company name"
                />
                <TextField
                  label="Tax ID"
                  type="text"
                  value={formData().taxId}
                  onInput={(e) => updateField("taxId", e.currentTarget.value)}
                  placeholder="Tax ID for invoicing"
                />
              </FormRow>
            </Show>

            {/* Contact Info */}
            <FormStack>
              <SectionTitle>Contact Information</SectionTitle>

              <TextField
                label="Contact Name *"
                type="text"
                required
                value={formData().name}
                onInput={(e) => updateField("name", e.currentTarget.value)}
                placeholder="Full name"
              />

              <FormRow cols={2}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData().email}
                  onInput={(e) => updateField("email", e.currentTarget.value)}
                  placeholder="email@example.com"
                />
                <TextField
                  label="Phone *"
                  type="tel"
                  required
                  value={formData().phone}
                  onInput={(e) => updateField("phone", e.currentTarget.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </FormRow>
            </FormStack>

            {/* Address */}
            <FormStack>
              <SectionTitle>Address</SectionTitle>

              <TextField
                label="Address Line 1"
                type="text"
                value={formData().addressLine1}
                onInput={(e) => updateField("addressLine1", e.currentTarget.value)}
                placeholder="Street address"
              />

              <TextField
                label="Address Line 2"
                type="text"
                value={formData().addressLine2}
                onInput={(e) => updateField("addressLine2", e.currentTarget.value)}
                placeholder="Suite, unit, building, etc."
              />

              <FormRow cols={3}>
                <TextField
                  label="City"
                  type="text"
                  value={formData().city}
                  onInput={(e) => updateField("city", e.currentTarget.value)}
                  placeholder="City"
                />
                <TextField
                  label="State"
                  type="text"
                  value={formData().state}
                  onInput={(e) => updateField("state", e.currentTarget.value)}
                  placeholder="State"
                />
                <TextField
                  label="ZIP Code"
                  type="text"
                  value={formData().zipCode}
                  onInput={(e) => updateField("zipCode", e.currentTarget.value)}
                  placeholder="ZIP"
                />
              </FormRow>
            </FormStack>

            {/* Preferences */}
            <FormStack>
              <SectionTitle>Preferences</SectionTitle>

              <Select
                label="Preferred Contact Method"
                value={formData().preferredContact}
                onChange={(e) => updateField("preferredContact", e.currentTarget.value as PreferredContact | "")}
              >
                <option value="">No preference</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text</option>
              </Select>

              <Checkbox
                label="Opt in to marketing communications"
                checked={formData().marketingOptIn}
                onChange={(e) => updateField("marketingOptIn", e.currentTarget.checked)}
              />
            </FormStack>

            {/* Notes */}
            <TextArea
              label="Notes"
              value={formData().notes}
              onInput={(e) => updateField("notes", e.currentTarget.value)}
              rows={3}
              placeholder="Additional notes about this customer..."
            />
          </FormStack>
        </ModalBody>

        <ModalFooter>
          <ButtonGroup>
            <Button
              type="button"
              onClick={props.onClose}
              disabled={loading()}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading()}
              variant="primary"
              size="sm"
            >
              {loading() ? "Saving..." : isEditMode() ? "Save Changes" : "Add Customer"}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
