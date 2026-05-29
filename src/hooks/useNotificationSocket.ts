/**
 * hooks/useNotificationSocket.ts — Hook pour écouter les notifications en temps réel
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const useNotificationSocket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;
    const socket = connectSocket(token);

    // Fonction pour rafraîchir les données au moment de la connexion
    const handleConnect = () => {
      console.log('[Socket] Connecté - Rafraîchissement des notifications...');
      
      // ⚡ OPTIMISATION 6: Invalider seulement le compteur à la connexion (pas toutes les listes)
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    };

    // Écouter les nouvelles notifications
    const handleNewNotification = (data: any) => {
      console.log('[Socket] Nouvelle notification reçue:', data);
      
      const notification = data.notification;
      
      // ⚡ OPTIMISATION 7: Mettre à jour le compteur IMMÉDIATEMENT (avant le toast)
      queryClient.setQueryData(['notif-count'], (old: any) => {
        const currentCount = typeof old === 'number' ? old : (old?.data?.count ?? 0);
        return currentCount + 1;
      });

      // ⚡ OPTIMISATION 8: Ajouter la notification directement au cache (pas besoin d'invalider)
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData?.notifications) return oldData;
        return {
          ...oldData,
          notifications: [notification, ...oldData.notifications],
        };
      });
      
      // Afficher un toast selon le type
      if (notification.type === 'rdv') {
        if (notification.titre.includes('annulé')) {
          toast.error(notification.titre, {
            description: notification.contenu,
            duration: 5000,
          });
        } else if (notification.titre.includes('confirmé')) {
          toast.success(notification.titre, {
            description: notification.contenu,
            duration: 5000,
          });
        } else {
          toast.info(notification.titre, {
            description: notification.contenu,
            duration: 4000,
          });
        }
        
        // ⚡ OPTIMISATION 9: Invalider les RDV de manière asynchrone (non-bloquant)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['mes-rdv'] });
          queryClient.invalidateQueries({ queryKey: ['rdv-jour'] });
          queryClient.invalidateQueries({ queryKey: ['mon-agenda'] });
          queryClient.invalidateQueries({ queryKey: ['rdv-en-attente'] });
        }, 100);
      } else {
        toast.info(notification.titre, {
          description: notification.contenu,
          duration: 4000,
        });
      }
    };

    // Écouter les mises à jour du compteur
    const handleCountUpdate = (data: any) => {
      console.log('[Socket] Compteur notifications mis à jour:', data.count);
      
      // Mettre à jour directement le cache du compteur
      queryClient.setQueryData(['notif-count'], data.count);
    };

    // Enregistrer les listeners
    socket.on('connect', handleConnect);
    socket.on('new_notification', handleNewNotification);
    socket.on('notification_count_update', handleCountUpdate);

    console.log('[Socket] Listeners de notifications enregistrés');

    // Si déjà connecté, rafraîchir immédiatement
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_count_update', handleCountUpdate);
      console.log('[Socket] Listeners de notifications supprimés');
    };
  }, [queryClient, user]);
};
