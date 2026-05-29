import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/services/socket';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook pour écouter les nouveaux messages via Socket.io
 * et mettre à jour le cache en temps réel
 */
export const useMessageSocket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const messageCountKey = useMemo(() => ['message-count', user?.id], [user?.id]);
  const conversationsKey = useMemo(() => ['conversations', user?.id], [user?.id]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    const socket = connectSocket(token);

    // Écouter les nouveaux messages
    socket.on('new_message', (data: any) => {
      const message = data.message;
      const expediteur = data.expediteur;
      
      // Si je suis le destinataire, incrémenter le compteur immédiatement
      if (message.id_destinataire === user.id) {
        // useMessageCount stocke un nombre dans le cache
        queryClient.setQueryData(messageCountKey, (old: any) => {
          const currentCount = typeof old === 'number' ? old : (old?.data?.count ?? 0);
          return currentCount + 1;
        });

        // Mettre à jour les conversations dans le cache
        queryClient.setQueryData(conversationsKey, (old: any) => {
          if (!old?.conversations) return old;
          
          const conversations = old.conversations;
          const expediteurId = message.id_expediteur;
          
          // Trouver la conversation avec cet expéditeur
          const convIndex = conversations.findIndex((c: any) => c.interlocuteur?.id === expediteurId);
          
          if (convIndex !== -1) {
            // Conversation existe, mettre à jour
            const updatedConversations = [...conversations];
            updatedConversations[convIndex] = {
              ...updatedConversations[convIndex],
              dernier_message: message,
              non_lus: (updatedConversations[convIndex].non_lus || 0) + 1,
            };
            
            // Déplacer la conversation en haut de la liste
            const [conv] = updatedConversations.splice(convIndex, 1);
            updatedConversations.unshift(conv);
            
            return { ...old, conversations: updatedConversations };
          } else {
            // Nouvelle conversation, ajouter en haut
            const newConv = {
              interlocuteur: expediteur,
              dernier_message: message,
              non_lus: 1,
            };
            return { ...old, conversations: [newConv, ...conversations] };
          }
        });
      } else {
        // Si je suis l'expéditeur, juste mettre à jour le dernier message
        queryClient.setQueryData(conversationsKey, (old: any) => {
          if (!old?.conversations) return old;
          
          const conversations = old.conversations;
          const destinataireId = message.id_destinataire;
          
          const convIndex = conversations.findIndex((c: any) => c.interlocuteur?.id === destinataireId);
          
          if (convIndex !== -1) {
            const updatedConversations = [...conversations];
            updatedConversations[convIndex] = {
              ...updatedConversations[convIndex],
              dernier_message: message,
            };
            
            // Déplacer en haut
            const [conv] = updatedConversations.splice(convIndex, 1);
            updatedConversations.unshift(conv);
            
            return { ...old, conversations: updatedConversations };
          }
          
          return old;
        });
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [user, queryClient, conversationsKey, messageCountKey]);
};
