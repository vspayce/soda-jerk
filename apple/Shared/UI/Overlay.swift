import SpriteKit

/// Menu input, from a controller, the Siri Remote, a keyboard, or the
/// game's own drink buttons.
enum Nav { case up, down, left, right, select, back }

/// A full-screen panel over the game (the web's absolutely-positioned
/// screens): content laid out top to bottom in a column, scrolling if it's
/// taller than the screen, with buttons you can tap or move between with a
/// controller.
class Overlay: SKNode {
    let size: CGSize
    let content = SKNode()
    private(set) var buttons: [ButtonNode] = []
    private var focusIndex = 0
    /// Called by a Back / Menu press.
    var onBack: (() -> Void)?
    /// Whether to show which button has focus (controllers and remotes).
    static var showFocus: Bool = {
        #if os(tvOS)
        return true
        #else
        return false
        #endif
    }()

    // vertical layout cursor, in content coordinates (top = 0, going down)
    private var cursor: CGFloat = 0
    private var contentHeight: CGFloat = 0
    private var scrollY: CGFloat = 0
    private var dragStartY: CGFloat?
    private var dragStartScroll: CGFloat = 0
    private var dragMoved = false
    let topInset: CGFloat
    let bottomInset: CGFloat

    init(size: CGSize, backdropAlpha: CGFloat = 0.95, topInset: CGFloat = 40, bottomInset: CGFloat = 32) {
        self.size = size
        self.topInset = topInset * Theme.u
        self.bottomInset = bottomInset * Theme.u
        super.init()
        if backdropAlpha > 0 { addChild(Theme.backdrop(size, alpha: backdropAlpha)) }
        addChild(content)
    }
    required init?(coder: NSCoder) { fatalError() }

    // ------------------------------------------------------------ layout

    /// Adds `node` centred in the column, `gap` web px below the last.
    @discardableResult
    func add(_ node: SKNode, gap: CGFloat = 0, height: CGFloat? = nil, x: CGFloat? = nil) -> SKNode {
        let h = height ?? node.calculateAccumulatedFrame().height
        cursor += gap * Theme.u
        // a left-aligned label hangs from its left edge: start it where a
        // centred column of its width would
        var px = x ?? size.width / 2
        if x == nil, let l = node as? SKLabelNode, l.horizontalAlignmentMode == .left {
            px -= (l.preferredMaxLayoutWidth > 0 ? l.preferredMaxLayoutWidth : l.frame.width) / 2
        }
        node.position = CGPoint(x: px, y: -(cursor + h / 2))
        content.addChild(node)
        cursor += h
        contentHeight = cursor
        if let b = node as? ButtonNode { buttons.append(b) }
        return node
    }

    /// Registers a button placed by hand (not through `add`).
    func addButton(_ b: ButtonNode) { buttons.append(b) }

    /// Starts the column again from the top (for a screen that rebuilds).
    func resetLayout() {
        cursor = 0; contentHeight = 0; buttons = []; focusIndex = 0; scrollY = 0
    }

    /// Positions the content: centred if it fits, otherwise top-aligned and
    /// scrollable. Call after adding everything.
    func finishLayout(center: Bool = true) {
        let avail = size.height - topInset - bottomInset
        if center && contentHeight <= avail {
            scrollY = 0
            content.position = CGPoint(x: 0, y: size.height - topInset - (avail - contentHeight) / 2)
            maxScroll = 0
        } else {
            maxScroll = max(0, contentHeight - avail)
            content.position = CGPoint(x: 0, y: size.height - topInset)
        }
        baseY = content.position.y
        if !buttons.isEmpty { focus(0) }
    }

    private var maxScroll: CGFloat = 0
    private var baseY: CGFloat = 0

    private func setScroll(_ y: CGFloat) {
        scrollY = min(max(0, y), maxScroll)
        content.position.y = baseY + scrollY
    }

    // ------------------------------------------------------------ focus

    func focus(_ i: Int) {
        guard buttons.indices.contains(i) else { return }
        for (k, b) in buttons.enumerated() { b.setFocused(k == i, showRing: Overlay.showFocus) }
        focusIndex = i
        // keep the focused button on screen (only when focus is shown — a
        // touch screen just opens at the top)
        guard Overlay.showFocus else { return }
        let b = buttons[i]
        let yInContent = -b.position.y
        let top = scrollY, bottom = scrollY + (size.height - topInset - bottomInset)
        if yInContent - b.hitRect.height < top { setScroll(yInContent - b.hitRect.height) }
        else if yInContent + b.hitRect.height > bottom { setScroll(yInContent + b.hitRect.height - (size.height - topInset - bottomInset)) }
    }

    /// Controller / keyboard input. Returns true if handled.
    @discardableResult
    func handle(_ nav: Nav) -> Bool {
        switch nav {
        case .up, .left:
            if buttons.count > 1 && focusIndex > 0 { focus(focusIndex - 1) } else { setScroll(scrollY - 60 * Theme.u) }
        case .down, .right:
            if buttons.count > 1 && focusIndex < buttons.count - 1 { focus(focusIndex + 1) } else { setScroll(scrollY + 60 * Theme.u) }
        case .select:
            if buttons.indices.contains(focusIndex) { buttons[focusIndex].press() } else { onBack?() }
        case .back:
            onBack?()
        }
        return true
    }

    // ------------------------------------------------------------ touch

    private var slider: VolumeSlider?

    func touchBegan(_ p: CGPoint) {
        dragStartY = p.y; dragStartScroll = scrollY; dragMoved = false
        slider = buttons.compactMap { $0 as? VolumeSlider }.first { $0.contains(scenePoint: p) }
        slider?.set(fromSceneX: p.x)
    }

    func touchMoved(_ p: CGPoint) {
        if let slider { slider.set(fromSceneX: p.x); return }
        guard let start = dragStartY else { return }
        if abs(p.y - start) > 8 * Theme.u { dragMoved = true }
        if dragMoved && maxScroll > 0 { setScroll(dragStartScroll + (p.y - start)) }
    }

    func touchEnded(_ p: CGPoint) {
        defer { dragStartY = nil; slider = nil }
        guard !dragMoved, slider == nil else { return }
        if let i = buttons.firstIndex(where: { $0.contains(scenePoint: p) }) {
            focusIndex = i
            buttons[i].press()
        } else {
            tappedOutside(p)
        }
    }

    /// A tap that missed every button (some screens take any tap).
    func tappedOutside(_ p: CGPoint) {}

    /// Called every frame while this screen is up.
    func tick(_ dt: TimeInterval) {}
}
