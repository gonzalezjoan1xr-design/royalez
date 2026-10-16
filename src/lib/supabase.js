import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url || 'https://ujkvhsyrtdtggtaxqqfh.supabase.co', key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqa3Zoc3lydGR0Z2d0YXhxcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTA3NTksImV4cCI6MjEwNzU2Njc1OX0.T5tAXS2CWss5nkXmKObl2FinISkYEcCkclflZVyzvFA')
