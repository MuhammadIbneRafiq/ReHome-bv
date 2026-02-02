import React, { useState, useEffect } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import useUserStore from '../services/state/useUserSessionStore';

interface MessageNotificationsProps {
  onClick?: () => void;
}

const MessageNotifications: React.FC<MessageNotificationsProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Fetch unread message count
    const fetchUnreadCount = async () => {
      try {
        const { error, count } = await supabase
          .from('marketplace_messages')
          .select('*', { count: 'exact' })
          .eq('receiver_id', user.email)
          .eq('read', false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel(`user_messages_${user.email}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `receiver_id=eq.${user.email}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `receiver_id=eq.${user.email}`,
        },
        () => {
          // Refetch count when messages are marked as read
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div 
      className="relative cursor-pointer hover:opacity-80 transition-opacity" 
      onClick={onClick}
      title={`${unreadCount} unread messages`}
    >
      <FaEnvelope className="text-xl text-white hover:text-gray-200 transition-colors" />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default MessageNotifications; 