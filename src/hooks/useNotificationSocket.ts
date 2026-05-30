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
      
      // Invalider immédiatement toutes les queries pour récupérer les nouvelles données
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['mes-rdv'] });
      queryClient.invalidateQueries({ queryKey: ['rdv-jour'] });
      queryClient.invalidateQueries({ queryKey: ['mon-agenda'] });
      queryClient.invalidateQueries({ queryKey: ['rdv-en-attente'] });
    };

    // Écouter les nouvelles notifications
    const handleNewNotification = (data: any) => {
      console.log('[Socket] Nouvelle notification reçue:', data);
      
      const notification = data.notification;
      
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
      } else {
        toast.info(notification.titre, {
          description: notification.contenu,
          duration: 4000,
        });
      }

      // Mettre à jour le compteur immédiatement dans le cache
      queryClient.setQueryData(['notif-count'], (old: any) => {
        const currentCount = typeof old === 'number' ? old : (old?.data?.count ?? 0);
        return currentCount + 1;
      });

      // Invalider les queries pour rafraîchir les listes
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Si c'est une notification de RDV, invalider aussi les RDV
      if (notification.type === 'rdv') {
        queryClient.invalidateQueries({ queryKey: ['mes-rdv'] });
        queryClient.invalidateQueries({ queryKey: ['rdv-jour'] });
        queryClient.invalidateQueries({ queryKey: ['mon-agenda'] });
        queryClient.invalidateQueries({ queryKey: ['rdv-en-attente'] });
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
