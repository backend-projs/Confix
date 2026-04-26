import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://cpnhvqslermplvrnrkqf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwbmh2cXNsZXJtcGx2cm5ya3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQzNDYsImV4cCI6MjA5MjY5MDM0Nn0.D91ZIN2LVmUwQXcOEeyPrMRzQwcu8gCX-EC_H-Hnkyg';

export const supabase = createClient(supabaseUrl, supabaseKey);
