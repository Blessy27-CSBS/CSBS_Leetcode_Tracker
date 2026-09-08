import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zzaapugrqrtxcojtuhsy.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6YWFwdWdycXJ0eGNvanR1aHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NDc0NDAsImV4cCI6MjEwNDQyMzQ0MH0.kk1F__85PU7zRUNs1ZT-sBzwtFq5-P9Fz4KeQGZ-2B0';

export const isClientSupabaseConfigured = Boolean(url && key);

export const supabaseClient = isClientSupabaseConfigured ? createClient(url, key) : null;
