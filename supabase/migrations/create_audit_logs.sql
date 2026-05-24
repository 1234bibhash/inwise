-- Migration: Create Audit Logs Table

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    details text NOT NULL,
    user_id text NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view logs
CREATE POLICY "Enable read access for all users" ON public.audit_logs
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

-- Create policy to allow authenticated users to insert logs
CREATE POLICY "Enable insert access for authenticated users" ON public.audit_logs
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (true);
