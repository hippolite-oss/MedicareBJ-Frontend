/**
 * hooks/useErrorHandler.ts - Hook pour gérer les erreurs de manière cohérente
 */
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessages';

export function useErrorHandler() {
  /**
   * Affiche un message d'erreur compréhensible
   */
  const handleError = (error: any, customMessage?: string) => {
    const message = customMessage || getErrorMessage(error);
    toast.error(message);
    
    // Log l'erreur en console pour le debugging (seulement en dev)
    if (import.meta.env.DEV) {
      console.error('Error details:', error);
    }
  };

  /**
   * Affiche un message de succès
   */
  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  /**
   * Affiche un message d'information
   */
  const handleInfo = (message: string) => {
    toast.info(message);
  };

  /**
   * Affiche un message d'avertissement
   */
  const handleWarning = (message: string) => {
    toast.warning(message);
  };

  /**
   * Wrapper pour les appels API avec gestion d'erreur automatique
   */
  const withErrorHandling = async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
    }
  ): Promise<T | null> => {
    try {
      const result = await apiCall();
      
      if (options?.successMessage) {
        handleSuccess(options.successMessage);
      }
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      handleError(error, options?.errorMessage);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      return null;
    }
  };

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
    withErrorHandling,
  };
}
