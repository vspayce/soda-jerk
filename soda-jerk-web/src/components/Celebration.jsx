import { DachshundGlyph } from './sprites.jsx'

// A dachshund scurries through, and the points float up and fade — fired
// briefly wherever a hot dog just got grabbed.
export default function Celebration({ points }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: '50%', top: 0 }}>
      <div className="absolute dachshund-scurry" style={{ left: 0, top: -14, transform: 'translate(-50%, -50%)' }}>
        <DachshundGlyph />
      </div>
      <div
        className="absolute celebrate-points font-display text-sm whitespace-nowrap"
        style={{ left: 0, top: 0, transform: 'translateX(-50%)', color: '#EDE3D0', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        +{points}
      </div>
    </div>
  )
}
