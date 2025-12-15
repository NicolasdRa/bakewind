import { createSignal } from "solid-js";

export type InfoModalType = 'info' | 'error' | 'warning' | 'success';

interface InfoModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: InfoModalType;
}

const [infoModalState, setInfoModalState] = createSignal<InfoModalState>({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
});

export const useInfoModal = () => {
  const showInfoModal = (title: string, message: string, type: InfoModalType = 'info') => {
    setInfoModalState({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const showError = (title: string, message: string) => {
    showInfoModal(title, message, 'error');
  };

  const showWarning = (title: string, message: string) => {
    showInfoModal(title, message, 'warning');
  };

  const showSuccess = (title: string, message: string) => {
    showInfoModal(title, message, 'success');
  };

  const showInfo = (title: string, message: string) => {
    showInfoModal(title, message, 'info');
  };

  const closeInfoModal = () => {
    setInfoModalState({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
    });
  };

  return {
    infoModalState,
    showInfoModal,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    closeInfoModal,
  };
};
