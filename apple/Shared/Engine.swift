import Foundation
import JavaScriptCore

/// The game's rules, run in JavaScriptCore. They're the web game's own
/// (soda-jerk-web/src/game), bundled into engine.js as a global `SodaJerk`;
/// this just loads that script and calls into it. The sim lives on the JS
/// side — `state` is a fresh snapshot of it, taken once a frame to draw.
final class Engine {
    private let context: JSContext
    private let api: JSValue
    private var sim: JSValue

    /// The sim as it stood at the last `refresh()`.
    private(set) var state = Snap([:])

    /// The engine's constants (constants.js), and the shared tables.
    let constants: Snap
    let venues: [Snap]
    let patronArt: [Snap]

    init() {
        guard let url = Bundle.main.url(forResource: "engine", withExtension: "js"),
              let source = try? String(contentsOf: url, encoding: .utf8) else {
            fatalError("engine.js missing from the app bundle — run `npm run build:engine` in soda-jerk-web")
        }
        context = JSContext()!
        context.exceptionHandler = { _, exception in
            print("engine.js error:", exception?.toString() ?? "unknown")
        }
        context.evaluateScript(source, withSourceURL: url)
        api = context.objectForKeyedSubscript("SodaJerk")
        sim = api.invokeMethod("createInitialSim", withArguments: [])
        constants = Snap(api.objectForKeyedSubscript("C").toDictionary() as? [String: Any] ?? [:])
        venues = (api.objectForKeyedSubscript("VENUES").toArray() as? [[String: Any]] ?? []).map(Snap.init)
        patronArt = (api.objectForKeyedSubscript("PATRON_ART").toArray() as? [[String: Any]] ?? []).map(Snap.init)
        refresh()
    }

    /// Advances the sim by `dt` seconds (the engine caps it), unless the
    /// game's over — the same as the web game's frame loop.
    func step(_ dt: Double) {
        if state.bool("gameOver") { return }
        api.invokeMethod("step", withArguments: [sim, dt])
    }

    /// Re-reads the whole sim for drawing.
    func refresh() {
        guard let json = api.invokeMethod("snapshot", withArguments: [sim])?.toString(),
              let data = json.data(using: .utf8),
              let dict = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
        state = Snap(dict)
    }

    /// Calls one of the engine's actions (engine.js) on the sim:
    /// `call("pourDrink", 0)`, `call("changeLane", -1)`…
    func call(_ action: String, _ args: Any...) {
        api.invokeMethod(action, withArguments: [sim] + args)
    }

    /// Calls one of the shared module's plain functions (not an action on
    /// the sim): `value("trickForClear", 3)`.
    func value(_ function: String, _ args: Any...) -> Any? {
        api.invokeMethod(function, withArguments: args)?.toObject()
    }

    /// A brand-new game, straight onto the bar.
    func newGame() {
        sim = api.invokeMethod("newGame", withArguments: [])
        refresh()
    }
}

/// A read-only view of a JSON object from the engine, with typed getters
/// that fall back to zero / false / empty instead of crashing on a gap.
struct Snap {
    let raw: [String: Any]
    init(_ raw: [String: Any]) { self.raw = raw }

    func double(_ key: String) -> Double { (raw[key] as? NSNumber)?.doubleValue ?? 0 }
    func int(_ key: String) -> Int { (raw[key] as? NSNumber)?.intValue ?? 0 }
    func bool(_ key: String) -> Bool { (raw[key] as? NSNumber)?.boolValue ?? false }
    func string(_ key: String) -> String? { raw[key] as? String }
    func isNull(_ key: String) -> Bool { raw[key] == nil || raw[key] is NSNull }
    func object(_ key: String) -> Snap? { (raw[key] as? [String: Any]).map(Snap.init) }
    func list(_ key: String) -> [Snap] { (raw[key] as? [[String: Any]] ?? []).map(Snap.init) }
    func bools(_ key: String) -> [Bool] { (raw[key] as? [Any] ?? []).map { ($0 as? NSNumber)?.boolValue ?? false } }
    func ints(_ key: String) -> [Int] { (raw[key] as? [Any] ?? []).map { ($0 as? NSNumber)?.intValue ?? 0 } }
}
