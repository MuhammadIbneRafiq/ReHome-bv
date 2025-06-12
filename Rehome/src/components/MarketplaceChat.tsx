import React, { useState, useEffect, useRef } from 'react';
import useUserStore from '../services/state/useUserSessionStore';
import { 
  getMessagesByItemId, 
  sendMessage, 
  subscribeToItemMessages,
  MarketplaceMessage
} from '../services/marketplaceMessageService';

interface MarketplaceChatProps {
  item: {
    id: number;
    name: string;
    seller_email: string;
  };
  onClose: () => void;
}

const MarketplaceChat: React.FC<MarketplaceChatProps> = ({ item, onClose }) => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((state) => state.user);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load previous messages from Supabase
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await getMessagesByItemId(item.id);
        setMessages(data || []);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Setup real-time subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }

    subscriptionRef.current = subscribeToItemMessages(item.id, (newMessage) => {
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      scrollToBottom();
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [item.id]);

  // Handle sending new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user) return;

    try {
      const message: MarketplaceMessage = {
        item_id: item.id,
        content: messageText.trim(),
        sender_id: user.email,
        sender_name: user.email,
        receiver_id: item.seller_email
      };

      await sendMessage(message);
      setMessageText('');
      // No need to manually add message to state as it will come through the subscription
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">{item.name}</h2>
            <p className="text-sm text-gray-600">Chat with seller</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {error && (
          <div className="text-center text-red-500 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 max-w-[75%] p-3 rounded-lg ${
                msg.sender_id === user?.email
                  ? 'ml-auto bg-orange-500 text-white'
                  : 'mr-auto bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-xs mb-1 opacity-75">
                {msg.sender_name}
              </div>
              <div>{msg.content}</div>
              <div className="text-xs mt-1 opacity-75 text-right">
                {new Date(msg.created_at || '').toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={!user}
        />
        <button
          type="submit"
          className="bg-orange-500 text-white px-4 py-2 rounded-r-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          disabled={!messageText.trim() || !user}
        >
          Send
        </button>
      </form>

      {!user && (
        <div className="p-2 bg-gray-100 text-center text-sm text-gray-500">
          You need to log in to send messages.
        </div>
      )}
    </div>
  );
};

export default MarketplaceChat; 