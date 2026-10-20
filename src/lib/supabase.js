import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ujkvhsyrtdtggtaxqqfh.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XzDLPkVviCNtRWKmCxeR0Q_mR2Jh1qq'

export const supabase = createClient(url, key)
