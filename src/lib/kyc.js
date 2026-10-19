import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase' // adjust if your client lives elsewhere
import { useAuth } from '../context/AuthContext'

// Withdrawals at or above this amount need an approved ID + face verification.
export const KYC_WITHDRAW_THRESHOLD = 500
export const needsKyc = (amount) => Number(amount) >= KYC_WITHDRAW_THRESHOLD

// status: 'none' | 'pending' | 'approved' | 'rejected'
export function useKyc() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const suffix = useRef(Math.random().toString(36).slice(2))

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setRecord(data || null)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    refresh()
    if (!user?.id) return
    // status changes (approved / rejected) show up without a page reload
    const channel = supabase
      .channel(`kyc-${user.id}-${suffix.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kyc_verifications', filter: `user_id=eq.${user.id}` },
        refresh
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refresh])

  return { record, status: record?.status || 'none', loading, refresh }
}