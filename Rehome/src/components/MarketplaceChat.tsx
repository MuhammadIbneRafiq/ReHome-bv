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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((state) => state.user);
  const channelRef = useRef<any>(null);

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
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Setup real-time subscription
    const channel = subscribeToItemMessages(item.id, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    channelRef.current = channel;

    return () => {
      // Clean up subscription when component unmounts
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [item.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !user) return;

    const newMessage: MarketplaceMessage = {
      content: messageText,
      item_id: item.id,
      sender_id: user.email,
      sender_name: user.email,
      receiver_id: item.seller_email,
      created_at: new Date().toISOString(),
    };

    try {
      await sendMessage(newMessage);
      
      // Clear input field
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-96 border border-gray-200 rounded-lg">
      <div className="bg-orange-500 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-medium">Chat with Seller</h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          ×
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
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
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
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
          className="bg-orange-500 text-white px-4 py-2 rounded-r-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
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