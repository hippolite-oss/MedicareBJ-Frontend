/**
 * components/ToastProvider.tsx — Provider global pour les toasts/notifications
 */
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
    />
  );
};

// Fonctions utilitaires pour afficher des toasts
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

export default ToastProvider;
