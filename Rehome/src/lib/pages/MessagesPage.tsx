import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../services/state/useUserSessionStore';
import { getMessagesByUserId, getMessagesByItemId, markMessagesAsRead, subscribeToUserMessages, sendMessage, MarketplaceMessage } from '../../services/marketplaceMessageService';
import { FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';

interface Conversation {
  itemId: number;
  itemName: string;
  otherUser: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/messages');
    }
  }, [user, navigate]);

  // Fetch all messages and group them by conversation
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const allMessages = await getMessagesByUserId(user.email);
        
        // Group messages by item_id
        const groupedMessages: { [key: number]: MarketplaceMessage[] } = {};
        const itemDetails: { [key: number]: { name: string } } = {};
        
        allMessages.forEach(message => {
          if (!groupedMessages[message.item_id]) {
            groupedMessages[message.item_id] = [];
            // We'll need to fetch item details from the backend in real implementation
            itemDetails[message.item_id] = { name: `Item #${message.item_id}` };
          }
          groupedMessages[message.item_id].push(message);
        });
        
        // Create conversation summaries
        const conversationList: Conversation[] = Object.keys(groupedMessages).map(itemIdStr => {
          const itemId = parseInt(itemIdStr);
          const msgs = groupedMessages[itemId];
          const lastMsg = msgs.sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          )[0];
          
          const otherUserName = lastMsg.sender_id === user.email ? lastMsg.receiver_id : lastMsg.sender_name;
          
          const unreadCount = msgs.filter(msg => 
            msg.receiver_id === user.email && !msg.read
          ).length;
          
          return {
            itemId,
            itemName: itemDetails[itemId].name,
            otherUser: otherUserName,
            lastMessage: lastMsg.content,
            lastMessageTime: lastMsg.created_at || '',
            unreadCount
          };
        });
        
        // Sort by most recent message
        conversationList.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        
        setConversations(conversationList);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = subscribeToUserMessages(user.email, (newMsg) => {
      // When a new message arrives, update the conversations list
      setConversations(prevConversations => {
        // Find the conversation for this item
        const existingConvIndex = prevConversations.findIndex(c => c.itemId === newMsg.item_id);
        
        if (existingConvIndex >= 0) {
          // Update the existing conversation
          const updatedConversations = [...prevConversations];
          const conv = updatedConversations[existingConvIndex];
          
          updatedConversations[existingConvIndex] = {
            ...conv,
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.created_at || '',
            unreadCount: conv.unreadCount + (newMsg.receiver_id === user.email ? 1 : 0)
          };
          
          // Move the conversation to the top
          updatedConversations.splice(existingConvIndex, 1);
          updatedConversations.unshift(updatedConversations[existingConvIndex]);
          
          return updatedConversations;
        } else {
          // Create a new conversation
          const newConversation: Conversation = {
            itemId: newMsg.item_id,
            itemName: `Item #${newMsg.item_id}`, // We'll need to fetch item details
            otherUser: newMsg.sender_id === user.email ? newMsg.receiver_id : newMsg.sender_name,
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.created_at || '',
            unreadCount: newMsg.receiver_id === user.email ? 1 : 0
          };
          
          return [newConversation, ...prevConversations];
        }
      });
      
      // If this message belongs to the active conversation, add it to the messages list
      if (activeConversation === newMsg.item_id) {
        setMessages(prev => [...prev, newMsg]);
        
        // Mark the message as read if it's for the current user
        if (newMsg.receiver_id === user.email) {
          markMessagesAsRead(newMsg.item_id, user.email);
        }
      }
    });
    
    return () => {
      if (subscription) {
        subscription();
      }
    };
  }, [user, activeConversation]);
  
  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;
    
    const fetchConversationMessages = async () => {
      try {
        const allMessages = await getMessagesByItemId(activeConversation);
        setMessages(allMessages);
        
        // Mark messages as read
        await markMessagesAsRead(activeConversation, user.email);
        
        // Update the unread count in the conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.itemId === activeConversation 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      } catch (error) {
        console.error('Error fetching conversation messages:', error);
      }
    };
    
    fetchConversationMessages();
  }, [activeConversation, user]);

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-orange-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Conversations List */}
            <div className="border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-lg">Conversations</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <FaEnvelopeOpen className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No messages yet.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your messages will appear here when you start a conversation with a seller.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <div 
                      key={conv.itemId}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${activeConversation === conv.itemId ? 'bg-orange-50' : ''}`}
                      onClick={() => setActiveConversation(conv.itemId)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{conv.itemName}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{conv.otherUser}: {conv.lastMessage}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Message Thread */}
            <div className="col-span-2 flex flex-col h-[600px]">
              {activeConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-lg">
                      {conversations.find(c => c.itemId === activeConversation)?.itemName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Chatting with {conversations.find(c => c.itemId === activeConversation)?.otherUser}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`max-w-[75%] p-3 rounded-lg ${
                          msg.sender_id === user.email
                            ? 'ml-auto bg-orange-500 text-white'
                            : 'mr-auto bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="text-xs mb-1 opacity-75">
                          {msg.sender_name}
                        </div>
                        <div>{msg.content}</div>
                        <div className="text-xs mt-1 opacity-75 text-right">
                          {new Date(msg.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200">
                    <form 
                      className="flex"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newMessage.trim() || !activeConversation) return;
                        
                        const msg: MarketplaceMessage = {
                          item_id: activeConversation,
                          content: newMessage,
                          sender_id: user.email,
                          sender_name: user.email,
                          receiver_id: conversations.find(c => c.itemId === activeConversation)?.otherUser || '',
                        };
                        
                        try {
                          await sendMessage(msg);
                          setNewMessage('');
                        } catch (error) {
                          console.error('Error sending message:', error);
                        }
                      }}
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="submit"
                        className="bg-orange-500 text-white px-4 py-2 rounded-r-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={!newMessage.trim()}
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <FaEnvelope className="text-5xl text-orange-300 mb-4" />
                  <h3 className="font-medium text-lg mb-2">Select a conversation</h3>
                  <p className="text-gray-600 max-w-sm">
                    Choose a conversation from the list to view messages or start a new conversation by contacting a seller from the marketplace.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 