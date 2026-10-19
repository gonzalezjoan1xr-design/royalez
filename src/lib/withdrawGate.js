// Withdrawals at or above this amount need an email code first.
export const WITHDRAW_AUTH_THRESHOLD = 500

const KEY = 'rm_withdraw_verified'
const TTL_MS = 10 * 60 * 1000 // a verification stays valid for 10 minutes

export const needsVerification = (amount) => Number(amount) >= WITHDRAW_AUTH_THRESHOLD

export const markVerified = () => sessionStorage.setItem(KEY, String(Date.now()))

export const isVerified = () => {
  const t = Number(sessionStorage.getItem(KEY))
  return Boolean(t) && Date.now() - t < TTL_MS
}

export const clearVerified = () => sessionStorage.removeItem(KEY)
