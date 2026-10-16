import SpriteKit

// The web game's screens (components/*Screen.jsx), drawn natively. Each is
// an Overlay: tap its buttons, or move between them with a controller and
// press A. Text and numbers come from the same places the web's do — the
// engine's constants, its lingo list, its tricks.

#if os(tvOS)
private let tapWord = "PRESS"
private let startText = "Press to Start"
#else
private let tapWord = "TAP"
private let startText = "Tap to Start"
#endif

// ------------------------------------------------------------ splash

/// The title screen (SplashScreen.jsx): the splash art, a fade to ink at
/// the bottom, and the sign-style start button.
final class SplashScreen: Overlay {
    init(size: CGSize, onStart: @escaping () -> Void, onHighScores: @escaping () -> Void) {
        super.init(size: size, backdropAlpha: 0, topInset: 0, bottomInset: 0)
        let u = Theme.u
        // cover the screen, anchored a fifth of the way down (center 20%);
        // a widescreen TV shows the whole picture instead, over a dimmed,
        // enlarged copy of it
        let art = SKSpriteNode(texture: Art.texture("splash.png"))
        let ts = art.texture!.size()
        let cover = max(size.width / ts.width, size.height / ts.height)
        #if os(tvOS)
        let behind = SKSpriteNode(texture: art.texture)
        behind.size = CGSize(width: ts.width * cover, height: ts.height * cover)
        behind.position = CGPoint(x: size.width / 2, y: size.height / 2)
        behind.alpha = 0.25
        addChild(behind)
        let fit = size.height / ts.height
        art.size = CGSize(width: ts.width * fit, height: ts.height * fit)
        art.position = CGPoint(x: size.width / 2, y: size.height / 2)
        #else
        art.size = CGSize(width: ts.width * cover, height: ts.height * cover)
        art.position = CGPoint(x: size.width / 2, y: size.height - art.size.height / 2 + (art.size.height - size.height) * 0.2)
        #endif
        addChild(art)
        let fadeH = min(size.height * 0.55, 380 * u)
        let fade = SKSpriteNode(texture: SKTexture.verticalGradient(top: Theme.ink.withAlphaComponent(0), bottom: Theme.ink),
                                size: CGSize(width: size.width, height: fadeH))
        fade.position = CGPoint(x: size.width / 2, y: fadeH / 2)
        addChild(fade)

        let by = Theme.label("A GAME BY SPAYCELORD", .body, 10, color: Theme.cream.withAlphaComponent(0.4), tracking: 0.25)
        let start = SignButton(startText, action: onStart)
        let scores = LinkButton("HIGH SCORES", action: onHighScores)
        var y = 48 * u + scores.hitRect.height / 2
        scores.position = CGPoint(x: size.width / 2, y: y)
        y += scores.hitRect.height / 2 + 16 * u + start.hitRect.height / 2
        start.position = CGPoint(x: size.width / 2, y: y)
        y += start.hitRect.height / 2 + 20 * u
        by.position = CGPoint(x: size.width / 2, y: y)
        for n in [by, start, scores] as [SKNode] { addChild(n) }
        addButton(start); addButton(scores)
        focus(0)
    }
    required init?(coder: NSCoder) { fatalError() }
}

// ------------------------------------------------------------ instructions

/// "How to score" (InstructionsScreen.jsx), shown once before play starts.
final class InstructionsScreen: Overlay {
    init(size: CGSize, engine: Engine, onContinue: @escaping () -> Void, onLingo: @escaping () -> Void) {
        super.init(size: size, backdropAlpha: 0.95, topInset: 32, bottomInset: 32)
        let u = Theme.u
        let C = engine.constants
        let oust = C.ints("OUST_POINTS_BY_STAGE")
        let colW = min(320 * u, size.width - 48 * u)

        add(Theme.label("HOW TO SCORE", .display, 24, color: Theme.brass, weight: 700, tracking: 0.03))
        #if os(tvOS)
        let howto = "PRESS A OR B FOR A GLASS SLIDE — MATCH THEIR OUTFIT"
        #else
        let howto = "TAP A DRINK FOR A GLASS SLIDE — MATCH THEIR OUTFIT"
        #endif
        add(Theme.label(howto, .body, 12, color: Theme.cream.withAlphaComponent(0.5), tracking: 0.2, width: colW), gap: 8)

        let rows: [(String, String, [String])] = [
            ("Knock a patron out the door", "+\(oust.first ?? 50)–\(oust.last ?? 150)", ["drink-orange.png", "drink-pink.png"]),
            ("Catch a returning glass", "+\(C.int("POINTS_PER_CAUGHT_GLASS"))", ["glass-empty.png"]),
            ("Grab a hot dog", "+\(C.int("POINTS_PER_BONUS"))", ["hotdog.png"]),
        ]
        for (i, (label, points, icons)) in rows.enumerated() {
            let row = SKNode()
            let h: CGFloat = 54 * u
            // icons share a 52px column, centred, each at most 30px tall
            let iconCol: CGFloat = 52 * u
            let imgs = icons.map { Theme.image($0, height: 30) }
            let natural = imgs.reduce(0) { $0 + $1.size.width } + CGFloat(imgs.count - 1) * 4 * u
            let k = min(1, iconCol / natural)
            var x = -colW / 2 + (iconCol - natural * k) / 2
            for img in imgs {
                img.size = CGSize(width: img.size.width * k, height: img.size.height * k)
                img.position = CGPoint(x: x + img.size.width / 2, y: 0)
                row.addChild(img)
                x += img.size.width + 4 * u * k
            }
            let p = Theme.label(points, .display, 20, color: Theme.brass, weight: 700, align: .right)
            let l = Theme.label(label, .body, 14, color: Theme.cream.withAlphaComponent(0.8),
                                width: colW - iconCol - 12 * u - p.frame.width - 10 * u, align: .left, lineHeight: 1.15)
            l.position = CGPoint(x: -colW / 2 + iconCol + 12 * u, y: 0)
            p.position = CGPoint(x: colW / 2, y: 0)
            row.addChild(l); row.addChild(p)
            if i < rows.count - 1 {
                let rule = SKSpriteNode(color: Theme.brass.withAlphaComponent(0.2), size: CGSize(width: colW, height: max(1, u)))
                rule.position = CGPoint(x: 0, y: -h / 2)
                row.addChild(rule)
            }
            add(row, gap: i == 0 ? 18 : 0, height: h)
        }

        // the explainer box, with two patrons
        let text = "A drink knocks them back down the bar. Knock them out the door and they'll be back in a while; otherwise they stop to drink, slide the empty back to you, and come on again. A parent with their kid is heavier and moves less per drink. Get the whole crowd out at once to pass the level — and watch for bars that flip, with the tap on the other end. Grab a hot dog and the dachshund puts on a show — anyone watching it won't take a drink."
        let box = SKNode()
        let picsW: CGFloat = 70 * u
        let body = Theme.label(text, .body, 12, color: Theme.cream.withAlphaComponent(0.8), width: colW - picsW - 32 * u, align: .left, lineHeight: 1.2)
        let bh = body.frame.height + 22 * u
        let bg = SKShapeNode(rectOf: CGSize(width: colW, height: bh), cornerRadius: 6 * u)
        bg.fillColor = Theme.brass.withAlphaComponent(0.08)
        bg.strokeColor = Theme.brass.withAlphaComponent(0.25)
        bg.lineWidth = u
        box.addChild(bg)
        let p1 = Theme.image("patron-orange.png", height: 44), p2 = Theme.image("patron2-orange.png", height: 38)
        p1.position = CGPoint(x: -colW / 2 + 12 * u + p1.size.width / 2, y: 0)
        p2.position = CGPoint(x: p1.position.x + p1.size.width / 2 + 4 * u + p2.size.width / 2, y: -3 * u)
        body.position = CGPoint(x: -colW / 2 + picsW + 20 * u, y: 0)
        for n in [p1, p2, body] { box.addChild(n) }
        add(box, gap: 20, height: bh)

        add(SignButton("Let's Go", action: onContinue), gap: 28)
        add(LinkButton("SODA JERK LINGO", action: onLingo), gap: 14)
        finishLayout()
    }
    required init?(coder: NSCoder) { fatalError() }
}

// ------------------------------------------------------------ settings

/// Settings (SettingsScreen.jsx): music volume, how to play, the lingo,
/// and the dev shortcut to the next venue.
final class SettingsScreen: Overlay {
    init(size: CGSize, music: Music, onClose: @escaping () -> Void, onLingo: @escaping () -> Void, onSkipToNewVenue: (() -> Void)?) {
        super.init(size: size, backdropAlpha: 0.95, topInset: 44, bottomInset: 32)
        onBack = onClose
        let u = Theme.u
        let colW = min(320 * u, size.width - 48 * u)

        add(Theme.label("SETTINGS", .display, 24, color: Theme.brass, weight: 700, tracking: 0.03))
        add(Theme.label("MUSIC VOLUME", .body, 12, color: Theme.cream.withAlphaComponent(0.8), tracking: 0.1, width: colW, align: .left), gap: 28)
        add(VolumeSlider(width: colW, music: music), gap: 10)

        add(Theme.label("HOW TO PLAY", .display, 14, color: Theme.brass, weight: 700, tracking: 0.1, width: colW, align: .left), gap: 28)
        #if os(tvOS)
        let tips = [
            "Up and down on the d-pad or stick change bar; left and right run along it.",
            "A pours orange, B pours pink — match the patron's outfit.",
            "On the Siri Remote: swipe to move, click for orange, Play/Pause for pink.",
        ]
        #else
        let tips = [
            "Tap a lane to jump to it, or swipe up/down to move one at a time.",
            "Drag left or right to run along the counter.",
            "Tap the drink matching a patron's outfit color to send a glass slide their way.",
        ]
        #endif
        let common = [
            "A drink knocks a patron back down the bar. Knocked out the door, they score and come back later; short of it, they drink up, slide the empty back, and come on again.",
            "Get the level's whole crowd out the door at once to pass it — the count by your score shows how many are on the bar or still to come.",
            "Some levels flip bars around, with the tap on the right — run toward the door to go that way.",
            "A hot dog sets the dachshund dancing; patrons who turn to watch won't take a drink — one sent at them slides out the door.",
            "Tap a returning glass or a hot dog to grab it, or just run over one.",
            "Don't let a patron reach the end of the bar — you'll lose a life and get sprayed.",
        ]
        for (i, tip) in (tips + common).enumerated() {
            add(Theme.label("•  " + tip, .body, 12, color: Theme.cream.withAlphaComponent(0.8), width: colW, align: .left, lineHeight: 1.25), gap: i == 0 ? 12 : 9)
        }

        add(OutlineButton("SODA JERK LINGO", action: onLingo), gap: 28)
        if let onSkipToNewVenue { add(OutlineButton("SKIP TO NEW VENUE", action: onSkipToNewVenue), gap: 14) }
        add(LinkButton("CLOSE", px: 13, color: Theme.brass, action: onClose), gap: 22)
        finishLayout(center: false)

        #if os(iOS)
        let close = LinkButton("✕", px: 22, color: Theme.brass, action: onClose)
        close.position = CGPoint(x: size.width - 30 * u, y: size.height - 40 * u)
        addChild(close)
        addButton(close)
        #endif
    }
    required init?(coder: NSCoder) { fatalError() }

    override func handle(_ nav: Nav) -> Bool {
        // left/right on the focused volume slider turns it
        if let s = buttons.first(where: { $0.focused }) as? VolumeSlider, nav == .left || nav == .right {
            s.nudge(nav == .left ? -0.05 : 0.05)
            return true
        }
        return super.handle(nav)
    }
}

/// The music volume, 0–1: drag it, or move focus to it and press left/right.
final class VolumeSlider: ButtonNode {
    private let music: Music
    private let width: CGFloat
    private let fill = SKSpriteNode(color: Theme.brass, size: .zero)
    private let knob = SKShapeNode(circleOfRadius: 9 * Theme.u)

    init(width: CGFloat, music: Music) {
        self.music = music
        self.width = width
        super.init()
        let u = Theme.u
        let track = SKSpriteNode(color: Theme.cream.withAlphaComponent(0.2), size: CGSize(width: width, height: 4 * u))
        fill.anchorPoint = CGPoint(x: 0, y: 0.5)
        fill.position = CGPoint(x: -width / 2, y: 0)
        knob.fillColor = Theme.brass
        knob.strokeColor = Theme.ink
        for n in [track, fill, knob] as [SKNode] { addChild(n) }
        finish(size: CGSize(width: width + 24 * u, height: 36 * u), cornerRadius: 8 * u)
        action = {}
        refresh()
    }
    required init?(coder: NSCoder) { fatalError() }

    func nudge(_ d: Float) { music.volume = min(1, max(0, music.volume + d)); refresh() }
    func set(fromSceneX x: CGFloat) {
        guard let scene else { return }
        let local = convert(CGPoint(x: x, y: 0), from: scene).x
        music.volume = Float(min(1, max(0, (local + width / 2) / width)))
        refresh()
    }
    private func refresh() {
        let w = width * CGFloat(music.volume)
        fill.size = CGSize(width: w, height: 4 * Theme.u)
        knob.position = CGPoint(x: -width / 2 + w, y: 0)
    }
}

// ------------------------------------------------------------ lingo

/// The soda-jerk slang glossary (LingoScreen.jsx), from the engine's
/// JERK_LINGO list.
final class LingoScreen: Overlay {
    init(size: CGSize, engine: Engine, onClose: @escaping () -> Void) {
        super.init(size: size, backdropAlpha: 1, topInset: 40, bottomInset: 32)
        onBack = onClose
        let u = Theme.u
        let colW = min(360 * u, size.width - 48 * u)
        add(Theme.label("SODA JERK LINGO", .display, 24, color: Theme.brass, weight: 700, tracking: 0.03))
        add(Theme.label("WHAT THEY HOLLERED BEHIND THE COUNTER", .body, 11, color: Theme.cream.withAlphaComponent(0.6), tracking: 0.2, width: colW), gap: 8)
        for (i, item) in engine.constants.list("JERK_LINGO").enumerated() {
            let entry = SKNode()
            let term = Theme.label(item.string("term") ?? "", .display, 14, color: Theme.brass, weight: 700, align: .left)
            let def = Theme.label(item.string("def") ?? "", .body, 12, color: Theme.cream.withAlphaComponent(0.75), width: colW, align: .left)
            let h = term.frame.height + def.frame.height + 14 * u
            term.position = CGPoint(x: -colW / 2, y: h / 2 - term.frame.height / 2)
            def.position = CGPoint(x: -colW / 2, y: h / 2 - term.frame.height - 3 * u - def.frame.height / 2)
            let rule = SKSpriteNode(color: Theme.cream.withAlphaComponent(0.1), size: CGSize(width: colW, height: max(1, u)))
            rule.position = CGPoint(x: 0, y: -h / 2)
            for n in [term, def, rule] { entry.addChild(n) }
            add(entry, gap: i == 0 ? 26 : 8, height: h)
        }
        add(LinkButton("BACK", px: 14, color: Theme.brass, action: onClose), gap: 24)
        finishLayout(center: false)
    }
    required init?(coder: NSCoder) { fatalError() }
}

// ------------------------------------------------------------ high scores

/// Ten best scores, on this device (leaderboard.js, kept in UserDefaults).
enum Leaderboard {
    struct Entry: Codable { var initials: String; var score: Int; var date: Double }
    static let max = 10
    private static let key = "soda-jerk-leaderboard", initialsKey = "soda-jerk-initials"

    static var entries: [Entry] {
        guard let d = UserDefaults.standard.data(forKey: key), let list = try? JSONDecoder().decode([Entry].self, from: d) else { return [] }
        return list
    }
    static var lastInitials: String { UserDefaults.standard.string(forKey: initialsKey) ?? "" }
    static func qualifies(_ score: Int) -> Bool {
        guard score > 0 else { return false }
        let list = entries
        return list.count < max || score > (list.last?.score ?? 0)
    }
    /// Saves a score; returns where it landed (or -1 if it didn't make it).
    static func add(initials: String, score: Int) -> Int {
        let clean = String(initials.uppercased().filter { $0.isLetter || $0.isNumber }.prefix(3))
        let entry = Entry(initials: clean.isEmpty ? "???" : clean, score: score, date: Date().timeIntervalSince1970)
        var list = entries + [entry]
        list.sort { $0.score > $1.score }
        list = Array(list.prefix(max))
        if let d = try? JSONEncoder().encode(list) { UserDefaults.standard.set(d, forKey: key) }
        UserDefaults.standard.set(entry.initials, forKey: initialsKey)
        return list.firstIndex { $0.date == entry.date && $0.score == score } ?? -1
    }

    static func listNode(width: CGFloat, highlight: Int = -1) -> SKNode {
        let u = Theme.u
        let n = SKNode()
        let list = entries
        if list.isEmpty {
            n.addChild(Theme.label("No scores yet — be the first!", .body, 14, color: Theme.cream.withAlphaComponent(0.5)))
            return n
        }
        let rowH: CGFloat = 26 * u
        for (i, e) in list.enumerated() {
            let color = i == highlight ? Theme.brassLight : Theme.cream.withAlphaComponent(0.8)
            let y = (CGFloat(list.count) / 2 - CGFloat(i) - 0.5) * rowH
            let l = Theme.label("\(i + 1). \(e.initials)", .display, 14, color: color, weight: i == highlight ? 800 : 500, tracking: 0.1, align: .left)
            l.position = CGPoint(x: -width / 2, y: y)
            let s = Theme.label("\(e.score)", .body, 14, color: color, weight: i == highlight ? 700 : 400, align: .right)
            s.position = CGPoint(x: width / 2, y: y)
            n.addChild(l); n.addChild(s)
        }
        return n
    }
}

final class LeaderboardScreen: Overlay {
    init(size: CGSize, onClose: @escaping () -> Void) {
        super.init(size: size, backdropAlpha: 0.95)
        onBack = onClose
        let u = Theme.u
        add(Theme.label("HIGH SCORES", .display, 24, color: Theme.brass, weight: 700, tracking: 0.1))
        let list = Leaderboard.listNode(width: min(280 * u, size.width - 64 * u))
        add(list, gap: 20)
        add(LinkButton("BACK", px: 14, color: Theme.brass, action: onClose), gap: 24)
        finishLayout()
    }
    required init?(coder: NSCoder) { fatalError() }
}

// ------------------------------------------------------------ a life lost

/// "YOU GOT SPRAYED!" and the rest (LifeLostScreen.jsx): the picture for
/// what went wrong, and on in 3 seconds (or on a tap).
final class LifeLostScreen: Overlay {
    private var remaining: TimeInterval = 3
    private let countdown: SKLabelNode
    private let onContinue: () -> Void
    private var done = false

    init(size: CGSize, score: Int, lives: Int, reason: String?, onContinue: @escaping () -> Void) {
        self.onContinue = onContinue
        countdown = Theme.label("\(tapWord) TO CONTINUE · 3", .body, 14, color: Theme.brass, tracking: 0.2)
        super.init(size: size, backdropAlpha: 0.9)
        let u = Theme.u
        let image: String? = switch reason {
        case "spray": "spray-closeup.png"
        case "no-patron": "spilled-milkshake.png"
        case "glass", "mug", "drinking", "watching": "broken-glass.png"
        default: nil
        }
        add(Theme.label(GameScene.missTitle(reason), .display, 24, color: Theme.brass, weight: 700, tracking: 0.03))
        if let image {
            let img = Theme.image(image, height: min(size.height * 0.45 / u, 340))
            add(img, gap: 16)
        }
        add(Theme.label("SCORE \(score) · \(lives) \(lives == 1 ? "LIFE" : "LIVES") LEFT", .body, 12, color: Theme.cream.withAlphaComponent(0.7), tracking: 0.25), gap: 24)
        add(countdown, gap: 16)
        finishLayout()
        _ = u
    }
    required init?(coder: NSCoder) { fatalError() }

    private func go() { guard !done else { return }; done = true; onContinue() }
    override func handle(_ nav: Nav) -> Bool { if nav == .select || nav == .back { go() }; return true }
    override func tappedOutside(_ p: CGPoint) { go() }
    override func tick(_ dt: TimeInterval) {
        remaining -= dt
        countdown.setText("\(tapWord) TO CONTINUE · \(max(1, Int(ceil(remaining))))")
        if remaining <= 0 { go() }
    }
}

// ------------------------------------------------------------ level passed

/// LEVEL n PASSED (StagePassedScreen.jsx): the trick he's doing, its bonus
/// paid as he throws, and on in 5 seconds. Sits low, so the bar shows.
final class StagePassedScreen: Overlay {
    private var remaining: TimeInterval = 5
    private var sinceStart: TimeInterval = 0
    private let button: DecoButton
    private let bonusLabel: SKLabelNode
    private let onContinue: () -> Void
    private let onTrickBonus: (Int) -> Void
    private let trickBonus: Int
    private let throwDelay: TimeInterval
    private let hasTrick: Bool
    private var paid = false, done = false

    init(size: CGSize, clearCount: Int, trickName: String?, trickBonus: Int, throwDelayMs: Double,
         onContinue: @escaping () -> Void, onTrickBonus: @escaping (Int) -> Void) {
        self.onContinue = onContinue
        self.onTrickBonus = onTrickBonus
        self.trickBonus = trickBonus
        throwDelay = throwDelayMs / 1000
        hasTrick = trickName != nil
        button = DecoButton("LEVEL \(clearCount) PASSED", subtext: "\(tapWord) TO CONTINUE · 5", titlePx: 36, maxWidth: size.width - 32 * Theme.u) {}
        bonusLabel = Theme.label(" ", .body, 11, color: Theme.cream.withAlphaComponent(0.6), tracking: 0.2)
        super.init(size: size, backdropAlpha: 0)
        let u = Theme.u
        // the fade up from the bottom
        let fadeH = min(size.height * 0.45, 300 * u)
        let fade = SKSpriteNode(texture: SKTexture.verticalGradient(top: SKColor(hex: 0x140E0C, alpha: 0), bottom: SKColor(hex: 0x140E0C, alpha: 0.9)),
                                size: CGSize(width: size.width, height: fadeH))
        fade.position = CGPoint(x: size.width / 2, y: fadeH / 2)
        addChild(fade)
        button.action = { [weak self] in self?.go() }
        var y = 40 * u + button.hitRect.height / 2
        button.position = CGPoint(x: size.width / 2, y: y)
        addChild(button); addButton(button)
        if let trickName {
            y += button.hitRect.height / 2 + 18 * u
            bonusLabel.position = CGPoint(x: size.width / 2, y: y)
            let name = Theme.label(trickName, .display, 14, color: Theme.brass.withAlphaComponent(0.9), weight: 700, tracking: 0.22)
            name.position = CGPoint(x: size.width / 2, y: y + 20 * u)
            addChild(name); addChild(bonusLabel)
        }
        focus(0)
    }
    required init?(coder: NSCoder) { fatalError() }

    private func go() { guard !done else { return }; done = true; payIfDue(force: true); onContinue() }
    private func payIfDue(force: Bool = false) {
        guard hasTrick, !paid, force || sinceStart >= throwDelay else { return }
        paid = true
        onTrickBonus(trickBonus)
        bonusLabel.setText("NICE ONE  +\(trickBonus)")
    }
    override func handle(_ nav: Nav) -> Bool { if nav == .select || nav == .back { go() }; return true }
    override func tappedOutside(_ p: CGPoint) { go() }
    override func tick(_ dt: TimeInterval) {
        sinceStart += dt
        remaining -= dt
        payIfDue()
        button.subLabel?.setText("\(tapWord) TO CONTINUE · \(max(1, Int(ceil(remaining))))")
        if remaining <= 0 { go() }
    }
}

// ------------------------------------------------------------ game over

/// GAME OVER, POP BOY (GameOverScreen.jsx): the fired jerk, the final
/// score, initials for a high score, the board, and back in.
final class GameOverScreen: Overlay {
    private var initials: [Character]
    private var slot = 0
    private var letterLabels: [SKLabelNode] = []
    private var entryNode: SKNode?
    private let onRestart: () -> Void
    private let onLingo: () -> Void
    private let score: Int
    private static let alphabet = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

    init(size: CGSize, score: Int, onRestart: @escaping () -> Void, onLingo: @escaping () -> Void) {
        self.score = score
        self.onRestart = onRestart
        self.onLingo = onLingo
        let last = Array(Leaderboard.lastInitials.prefix(3))
        initials = last.count == 3 ? last : Array("AAA")
        super.init(size: size, backdropAlpha: 0.9)
        build(saved: !Leaderboard.qualifies(score), highlight: -1)
    }
    required init?(coder: NSCoder) { fatalError() }

    private func build(saved: Bool, highlight: Int) {
        content.removeAllChildren()
        resetLayout()
        let u = Theme.u
        let title = Theme.label("GAME OVER, POP BOY", .display, 30, color: SKColor(hex: 0xF3B6C6), weight: 800, tracking: 0.03)
        add(title)
        add(Theme.image("fired.png", height: 180), gap: 8)
        add(Theme.label("Final score", .body, 16, color: Theme.cream.withAlphaComponent(0.8)), gap: 8)
        add(Theme.label("\(score)", .display, 48, color: Theme.cream, weight: 800), gap: 4)
        if !saved {
            add(Theme.label("NEW HIGH SCORE — ENTER YOUR INITIALS", .body, 12, color: Theme.brass, tracking: 0.25), gap: 20)
            let entry = SKNode()
            letterLabels = (0..<3).map { i in
                let l = Theme.label(String(initials[i]), .display, 28, color: Theme.cream, weight: 700)
                l.position = CGPoint(x: CGFloat(i - 1) * 44 * u, y: 0)
                entry.addChild(l)
                return l
            }
            entryNode = entry
            add(entry, gap: 14, height: 40 * u)
            #if os(tvOS)
            let hint = "UP/DOWN CHANGES A LETTER · LEFT/RIGHT MOVES · A SAVES"
            #else
            let hint = "TAP A LETTER TO CHANGE IT"
            #endif
            add(Theme.label(hint, .body, 10, color: Theme.cream.withAlphaComponent(0.5), tracking: 0.15), gap: 6)
            add(OutlineButton("SAVE SCORE") { [weak self] in self?.save() }, gap: 14)
            showSlot()
        } else {
            add(Theme.label("HIGH SCORES", .body, 12, color: Theme.brass, tracking: 0.3), gap: 20)
            add(Leaderboard.listNode(width: min(280 * u, size.width - 64 * u), highlight: highlight), gap: 8)
        }
        add(SignButton("Tap to Reopen", action: onRestart), gap: 24)
        add(LinkButton("SODA JERK LINGO", action: onLingo), gap: 12)
        finishLayout(center: false)
    }

    private func save() {
        let index = Leaderboard.add(initials: String(initials), score: score)
        entryNode = nil
        build(saved: true, highlight: index)
    }

    private func showSlot() {
        for (i, l) in letterLabels.enumerated() {
            l.setText(String(initials[i]))
            l.alpha = i == slot ? 1 : 0.55
            l.setScale(i == slot ? 1.15 : 1)
        }
    }
    private func cycle(_ d: Int) {
        let a = Self.alphabet
        let i = a.firstIndex(of: initials[slot]) ?? 0
        initials[slot] = a[(i + d + a.count) % a.count]
        showSlot()
    }

    override func handle(_ nav: Nav) -> Bool {
        if entryNode != nil {
            switch nav {
            case .up: cycle(1); return true
            case .down: cycle(-1); return true
            case .left: slot = max(0, slot - 1); showSlot(); return true
            case .right: slot = min(2, slot + 1); showSlot(); return true
            case .select: save(); return true
            case .back: return true
            }
        }
        return super.handle(nav)
    }

    override func tappedOutside(_ p: CGPoint) {
        // tap a letter to step it on (and select that slot)
        for (i, l) in letterLabels.enumerated() where l.parent != nil {
            let lp = l.convert(CGPoint.zero, to: scene!)
            if abs(p.x - lp.x) < 22 * Theme.u && abs(p.y - lp.y) < 26 * Theme.u {
                if slot == i { cycle(1) } else { slot = i; showSlot() }
                return
            }
        }
    }
}
