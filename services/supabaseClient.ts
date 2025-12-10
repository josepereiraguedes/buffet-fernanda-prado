import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whajowuldfatynhqkjax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYWpvd3VsZGZhdHluaHFramF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzYxMDAsImV4cCI6MjA4MDk1MjEwMH0.t9CUmG_PRiDGwUAHSCbJI_CkulxpbjhJNK_0VSxsMDU';

export const supabase = createClient(supabaseUrl, supabaseKey);