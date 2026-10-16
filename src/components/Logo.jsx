import './Logo.css'
export default function Logo({ accent = false }) {
  return (
    <span className={`logo ${accent ? 'logo--accent' : ''}`}>
      <span className="logo__mark">♛</span>
      <span className="logo__text">Royal Markets</span>
    </span>
  )
}
