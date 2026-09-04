import Joystick from './Joystick.jsx'
import DrinkSelector from './DrinkSelector.jsx'

export default function Controls({ onUp, onDown, onServe, onRunStart, onRunStop, selectedDrink, onSelectDrink }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-between px-6 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}
    >
      <Joystick onUp={onUp} onDown={onDown} onRunStart={onRunStart} onRunStop={onRunStop} />

      <DrinkSelector selected={selectedDrink} onSelect={onSelectDrink} />

      <button
        onPointerDown={(e) => {
          e.preventDefault()
          onServe()
        }}
        className="flex items-center justify-center rounded-full border-2 border-brass text-brass active:bg-brass active:text-ink transition-colors select-none"
        style={{
          width: 84,
          height: 84,
          background: 'linear-gradient(180deg, #C6A15B 0%, #8A6E37 100%)',
          color: '#151014',
          fontFamily: '"Playfair Display", serif',
          fontWeight: 700,
          letterSpacing: '0.05em',
          pointerEvents: 'auto',
        }}
        aria-label="Pour or catch"
      >
        JERK
      </button>
    </div>
  )
}
