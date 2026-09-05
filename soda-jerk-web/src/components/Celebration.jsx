const DACHSHUND_SRC = `${import.meta.env.BASE_URL}art/dachshund.png`

// A dachshund pops up top-center and dances, while the points float up
// and fade — fired briefly whenever a hot dog gets grabbed, wherever on
// the bar it happened.
export default function Celebration({ points }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
      style={{ top: '6%' }}
    >
      <img src={DACHSHUND_SRC} alt="" className="dachshund-dance" style={{ height: 48, width: 'auto' }} />
      <div
        className="celebrate-points font-display text-sm whitespace-nowrap"
        style={{ color: '#EDE3D0', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        +{points}
      </div>
    </div>
  )
}
