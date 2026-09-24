import { PlayerSprite } from './sprites.jsx'

export default function Player({ x }) {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: '50%' }}
    >
      <PlayerSprite />
    </div>
  )
}
