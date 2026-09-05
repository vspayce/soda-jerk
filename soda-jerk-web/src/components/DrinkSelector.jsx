import { DRINK_TYPES } from '../game/constants.js'

const ICON_SRC = (icon) => `${import.meta.env.BASE_URL}art/${icon}`

// Sits between the joystick and the JERK button — pick which drink the
// next mug pours. It has to match what a customer actually wants (shown
// by their outfit color) to serve them.
export default function DrinkSelector({ selected, onSelect }) {
  return (
    <div className="flex gap-3 pointer-events-auto">
      {DRINK_TYPES.map((drink, i) => (
        <button
          key={i}
          onPointerDown={(e) => {
            e.preventDefault()
            onSelect(i)
          }}
          className="flex items-center justify-center overflow-hidden rounded-full transition-colors select-none"
          style={{
            width: 54,
            height: 54,
            background: '#151014',
            border: `2.5px solid ${selected === i ? '#EDE3D0' : 'rgba(21,16,20,0.6)'}`,
            boxShadow: selected === i ? '0 0 10px 3px rgba(237,227,208,0.6)' : '0 1px 4px rgba(0,0,0,0.5)',
          }}
          aria-label={`Pour ${drink.name}`}
          title={drink.name}
        >
          <img src={ICON_SRC(drink.icon)} alt="" className="w-full h-full object-contain p-1" />
        </button>
      ))}
    </div>
  )
}
