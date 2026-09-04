const CONFETTI_COLORS = ['#C6A15B', '#D9822B', '#D9668A', '#1B6F62', '#EDE3D0']

// Little burst of confetti + floating "+points" — fired briefly wherever
// a hot dog just got grabbed.
export default function Celebration({ points }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: '50%', top: 0 }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const dist = 22 + (i % 3) * 6
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - 6
        return (
          <div
            key={i}
            className="absolute confetti-bit rounded-sm"
            style={{
              left: 0,
              top: 0,
              width: 5,
              height: 5,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              '--rot': `${(i % 2 === 0 ? 1 : -1) * 180}deg`,
            }}
          />
        )
      })}
      <div
        className="absolute celebrate-points font-display text-sm whitespace-nowrap"
        style={{ left: 0, top: 0, transform: 'translateX(-50%)', color: '#EDE3D0', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        +{points}
      </div>
    </div>
  )
}
