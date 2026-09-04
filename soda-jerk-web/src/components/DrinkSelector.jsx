import { DRINK_TYPES } from '../game/constants.js'

// Sits between the joystick and the JERK button — pick which drink the
// next mug pours. Matching what a customer actually wants (shown by
// their outfit color) earns a bonus on top of the normal serve points.
export default function DrinkSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 pointer-events-auto">
      {DRINK_TYPES.map((drink, i) => (
        <button
          key={i}
          onPointerDown={(e) => {
            e.preventDefault()
            onSelect(i)
          }}
          className="rounded-full transition-colors select-none"
          style={{
            width: 28,
            height: 28,
            background: drink.color,
            border: `2px solid ${selected === i ? '#EDE3D0' : 'rgba(21,16,20,0.6)'}`,
            boxShadow: selected === i ? '0 0 8px 2px rgba(237,227,208,0.55)' : '0 1px 3px rgba(0,0,0,0.5)',
          }}
          aria-label={`Pour ${drink.name}`}
          title={drink.name}
        />
      ))}
    </div>
  )
}
