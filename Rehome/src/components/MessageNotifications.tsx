import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import useUserStore from '../services/state/useUserSessionStore';

// Create supabase client
const SUPABASE_URL = "https://okkdlbdnfaylakfbycta.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ra2RsYmRuZmF5bGFrZmJ5Y3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MjIzNTIsImV4cCI6MjAyOTA5ODM1Mn0.Zf4DnOscUxz5LxbulHsMMmtyXT7Eoapg50WVgAW_Nig";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface MessageNotificationsProps {
  onClick?: () => void;
}

const MessageNotifications: React.FC<MessageNotificationsProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    // Fetch unread message count
    const fetchUnreadCount = async () => {
      const { data, error, count } = await supabase
        .from('marketplace_messages')
        .select('*', { count: 'exact' })
        .eq('receiver_id', user.email)
        .eq('read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
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
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  if (!user || unreadCount === 0) {
    return null;
  }

  return (
    <div 
      className="relative cursor-pointer" 
      onClick={onClick}
    >
      <FaEnvelope className="text-2xl text-orange-500" />
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </div>
    </div>
  );
};

export default MessageNotifications; 