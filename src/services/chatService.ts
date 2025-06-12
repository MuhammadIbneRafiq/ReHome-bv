import { toast } from 'react-toastify';
import { supabase } from '../lib/supabaseClient';

// Interfaces
export interface Chat {
    id: string;
    chat_id: string;
    title: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    latest_message?: string;
    latest_message_time?: string;
    latest_sender?: string;
    message_count: number;
}

export interface Message {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    sender: 'user' | 'assistant';
    created_at: string;
    is_final: boolean;
    search_needed: boolean;
    message_type: 'text' | 'image' | 'file' | 'system';
    metadata: Record<string, any>;
}

export interface Project {
    id: string;
    user_id: string;
    chat_id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    created_at: string;
    updated_at: string;
    completed_at?: string;
    metadata: Record<string, any>;
    chat_title?: string;
    chat_active?: boolean;
}

// Chat functions
export const getChats = async (): Promise<Chat[]> => {
    try {
        const { data, error } = await supabase
            .rpc('get_user_chats_with_latest_message', { user_uuid: supabase.auth.user()?.id });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error('Failed to fetch chats');
        return [];
    }
};

export const createChat = async (title: string): Promise<Chat | null> => {
    try {
        const { data, error } = await supabase
            .from('chats')
            .insert([{
                title,
                user_id: supabase.auth.user()?.id,
                chat_id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating chat:', error);
        toast.error('Failed to create chat');
        return null;
    }
};

// Message functions
export const getMessages = async (chatId: string): Promise<Message[]> => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages');
        return [];
    }
};

export const sendMessage = async (chatId: string, content: string, sender: 'user' | 'assistant' = 'user'): Promise<Message | null> => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                chat_id: chatId,
                user_id: supabase.auth.user()?.id,
                content,
                sender,
                message_type: 'text',
                metadata: {}
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return null;
    }
};

// Project functions
export const getProjects = async (): Promise<Project[]> => {
    try {
        const { data, error } = await supabase
            .from('projects_with_chat_view')
            .select('*')
            .eq('user_id', supabase.auth.user()?.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to fetch projects');
        return [];
    }
};

export const createProject = async (chatId: string, title: string, description: string): Promise<Project | null> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                chat_id: chatId,
                user_id: supabase.auth.user()?.id,
                title,
                description,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project');
        return null;
    }
};

export const updateProjectStatus = async (projectId: string, status: Project['status']): Promise<Project | null> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .update({ 
                status,
                ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
            })
            .eq('id', projectId)
            .eq('user_id', supabase.auth.user()?.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
        return null;
    }
};

// Realtime subscriptions
export const subscribeToChat = (chatId: string, onMessage: (message: Message) => void): (() => void) => {
    const subscription = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`
        }, (payload) => {
            onMessage(payload.new as Message);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
};

export const subscribeToProjects = (onUpdate: (project: Project) => void): (() => void) => {
    const subscription = supabase
        .channel('projects')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${supabase.auth.user()?.id}`
        }, (payload) => {
            onUpdate(payload.new as Project);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}; 