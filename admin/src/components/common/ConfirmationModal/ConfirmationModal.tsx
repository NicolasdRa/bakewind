import { Component, JSX } from "solid-js";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal/Modal";
import Button from "~/components/common/Button";
import { Text } from "~/components/common/Typography";

type ConfirmationVariant = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | JSX.Element;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  loading?: boolean;
}

/**
 * Reusable confirmation modal for delete, warning, and info confirmations.
 *
 * @example
 * ```tsx
 * <ConfirmationModal
 *   isOpen={showConfirm()}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmLabel="Delete"
 *   variant="danger"
 * />
 * ```
 */
const ConfirmationModal: Component<ConfirmationModalProps> = (props) => {
  const variant = () => props.variant || 'danger';
  const confirmLabel = () => props.confirmLabel || 'Confirm';
  const cancelLabel = () => props.cancelLabel || 'Cancel';

  const getButtonVariant = () => {
    switch (variant()) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary';
      case 'info':
        return 'primary';
      default:
        return 'danger';
    }
  };

  const handleConfirm = () => {
    if (!props.loading) {
      props.onConfirm();
    }
  };

  const handleClose = () => {
    if (!props.loading) {
      props.onClose();
    }
  };

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} size="sm">
      <ModalHeader title={props.title} onClose={handleClose} />
      <ModalBody>
        {typeof props.message === 'string' ? (
          <Text color="secondary">{props.message}</Text>
        ) : (
          props.message
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClose}
          disabled={props.loading}
        >
          {cancelLabel()}
        </Button>
        <Button
          variant={getButtonVariant()}
          size="sm"
          onClick={handleConfirm}
          loading={props.loading}
          disabled={props.loading}
        >
          {confirmLabel()}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmationModal;
