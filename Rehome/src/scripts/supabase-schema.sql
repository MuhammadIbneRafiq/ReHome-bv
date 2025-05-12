-- Create marketplace_messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id INTEGER NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for message access (only sender and receiver can view their messages)
CREATE POLICY "Users can view their own messages" ON public.marketplace_messages
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Create policy for message insertion (authenticated users can insert messages)
CREATE POLICY "Users can insert their own messages" ON public.marketplace_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable real-time for marketplace_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;

-- Index for faster queries
CREATE INDEX idx_marketplace_messages_item_id ON public.marketplace_messages(item_id);
CREATE INDEX idx_marketplace_messages_sender_id ON public.marketplace_messages(sender_id);
CREATE INDEX idx_marketplace_messages_receiver_id ON public.marketplace_messages(receiver_id);

-- Comments
COMMENT ON TABLE public.marketplace_messages IS 'Messages between buyers and sellers regarding marketplace items'; 