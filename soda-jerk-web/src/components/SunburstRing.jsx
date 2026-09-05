// Decorative radiating ring behind a round button — same conic-gradient
// sunburst trick used for the corner fans, just wrapped full-circle
// around a knob/valve instead of tucked into a corner.
export default function SunburstRing({ size }) {
  return (
    <div
      className="absolute rounded-full opacity-30 pointer-events-none"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'repeating-conic-gradient(#C6A15B 0deg 2deg, transparent 2deg 10deg)',
      }}
    />
  )
}
