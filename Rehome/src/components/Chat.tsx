import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useUserStore from '../services/state/useUserSessionStore';
import { Chat as ChatType, Message, getMessages, sendMessage, subscribeToChat } from '../services/chatService';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

interface ChatProps {
    chat?: ChatType;
    onClose?: () => void;
}

const Chat: React.FC<ChatProps> = ({ chat, onClose }) => {
    const { chatId } = useParams<{ chatId: string }>();
    const user = useUserStore(state => state.user);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const subscriptionRef = useRef<(() => void) | null>(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch messages on component mount
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatId) return;
            
            try {
                const fetchedMessages = await getMessages(chatId);
                setMessages(fetchedMessages);
                scrollToBottom();
            } catch (err) {
                setError('Failed to load messages');
            }
        };

        fetchMessages();
    }, [chatId]);

    // Subscribe to new messages
    useEffect(() => {
        if (!chatId || !user) return;

        // Cleanup previous subscription if it exists
        if (subscriptionRef.current) {
            subscriptionRef.current();
        }

        // Subscribe to new messages
        subscriptionRef.current = subscribeToChat(chatId, (newMsg) => {
            setMessages(prev => {
                // Check if message already exists
                if (prev.some(msg => msg.id === newMsg.id)) {
                    return prev;
                }
                return [...prev, newMsg];
            });
            scrollToBottom();
        });

        // Cleanup subscription on unmount
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current();
                subscriptionRef.current = null;
            }
        };
    }, [chatId, user]);

    // Handle sending new message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId || !user || isSending) return;

        setIsSending(true);
        try {
            const sentMessage = await sendMessage(chatId, newMessage.trim());
            if (sentMessage) {
                setNewMessage('');
                // No need to manually add message to state as it will come through the subscription
            }
        } catch (err) {
            setError('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (!user) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Please log in to view messages.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-lg">
                        {chat?.title || `Chat #${chatId}`}
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                    <div className="text-center text-red-500 py-2">
                        {error}
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`max-w-[75%] p-3 rounded-lg ${
                            msg.sender === 'user'
                                ? 'ml-auto bg-orange-500 text-white'
                                : 'mr-auto bg-gray-200 text-gray-800'
                        }`}
                    >
                        <div className="text-sm break-words">{msg.content}</div>
                        <div className="text-xs mt-1 opacity-75 text-right">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-orange-500"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:opacity-50"
                    >
                        {isSending ? (
                            <FaSpinner className="animate-spin" />
                        ) : (
                            <FaPaperPlane />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
