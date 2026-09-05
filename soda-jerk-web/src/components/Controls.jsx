import DrinkSelector from './DrinkSelector.jsx'
import SunburstRing from './SunburstRing.jsx'

const TAP_HANDLE_SRC = `${import.meta.env.BASE_URL}art/tap-handle-icon.png`

export default function Controls({ onServe, selectedDrink, onSelectDrink }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-center gap-6 px-4 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}
    >
      <DrinkSelector selected={selectedDrink} onSelect={onSelectDrink} />

      <div className="relative flex items-center justify-center" style={{ width: 84, height: 84 }}>
        <SunburstRing size={116} />
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            onServe()
          }}
          className="relative flex items-center justify-center rounded-full border-2 border-brass active:bg-brass/20 transition-colors select-none"
          style={{
            width: 84,
            height: 84,
            background: 'radial-gradient(circle at 40% 35%, #2B1B10 0%, #151014 100%)',
            pointerEvents: 'auto',
          }}
          aria-label="Pour or catch"
        >
          <img src={TAP_HANDLE_SRC} alt="" style={{ height: 62, width: 'auto' }} />
        </button>
      </div>
    </div>
  )
}
