import DrinkSelector from './DrinkSelector.jsx'

// Tapping a drink pours it immediately — no separate JERK button.
export default function Controls({ selectedDrink, onSelectDrink }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-end px-8 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}
    >
      <DrinkSelector selected={selectedDrink} onSelect={onSelectDrink} />
    </div>
  )
}
