import GameController

/// Reads every attached controller each frame and turns it into the few
/// things the bar game needs. Works with an extended gamepad (Xbox,
/// PlayStation, MFi), the Siri Remote (swipe and click), and a keyboard —
/// which is also how to play in the simulator.
///
///   Up / Down              change bar
///   Left / Right (held)    run along the bar
///   A  (Siri Remote click, Space or Z)        pour orange
///   B  (Siri Remote Play/Pause, X)            pour pink
///   Menu / Options  (Esc, P)                  pause
final class Controls {
    struct Frame {
        var laneStep = 0       // -1 up a bar, +1 down a bar, this frame only
        var run = 0            // -1 left, +1 right, while held
        var pourOrange = false // pressed this frame
        var pourPink = false
        var pause = false
        var any: Bool { laneStep != 0 || pourOrange || pourPink || pause }
    }

    private var wasUp = false, wasDown = false
    private var wasA = false, wasB = false, wasMenu = false

    init() {
        GCController.startWirelessControllerDiscovery {}
    }

    /// What the player's doing this frame. Edges (bar changes, pours,
    /// pause) fire once per press; running is level-triggered.
    func read() -> Frame {
        var up = false, down = false, left = false, right = false
        var a = false, b = false, menu = false

        for c in GCController.controllers() {
            if let g = c.extendedGamepad {
                let x = max(abs(g.dpad.xAxis.value), abs(g.leftThumbstick.xAxis.value)) > 0.5
                    ? (abs(g.dpad.xAxis.value) > abs(g.leftThumbstick.xAxis.value) ? g.dpad.xAxis.value : g.leftThumbstick.xAxis.value) : 0
                let y = abs(g.dpad.yAxis.value) > 0.5 ? g.dpad.yAxis.value : (abs(g.leftThumbstick.yAxis.value) > 0.6 ? g.leftThumbstick.yAxis.value : 0)
                left = left || x < -0.5
                right = right || x > 0.5
                up = up || y > 0.5
                down = down || y < -0.5
                a = a || g.buttonA.isPressed
                b = b || g.buttonB.isPressed || g.buttonX.isPressed
                menu = menu || g.buttonMenu.isPressed || (g.buttonOptions?.isPressed ?? false)
            } else if let m = c.microGamepad {
                // Siri Remote: swipes come through as a d-pad.
                m.reportsAbsoluteDpadValues = false
                left = left || m.dpad.xAxis.value < -0.5
                right = right || m.dpad.xAxis.value > 0.5
                up = up || m.dpad.yAxis.value > 0.5
                down = down || m.dpad.yAxis.value < -0.5
                a = a || m.buttonA.isPressed
                b = b || m.buttonX.isPressed
                menu = menu || m.buttonMenu.isPressed
            }
        }
        if let k = GCKeyboard.coalesced?.keyboardInput {
            func held(_ code: GCKeyCode) -> Bool { k.button(forKeyCode: code)?.isPressed ?? false }
            up = up || held(.upArrow) || held(.keyW)
            down = down || held(.downArrow) || held(.keyS)
            left = left || held(.leftArrow) || held(.keyA)
            right = right || held(.rightArrow) || held(.keyD)
            a = a || held(.spacebar) || held(.keyZ) || held(.returnOrEnter)
            b = b || held(.keyX)
            menu = menu || held(.escape) || held(.keyP)
        }

        var f = Frame()
        if up && !wasUp { f.laneStep = -1 }
        if down && !wasDown { f.laneStep = 1 }
        f.run = left == right ? 0 : (left ? -1 : 1)
        f.pourOrange = a && !wasA
        f.pourPink = b && !wasB
        f.pause = menu && !wasMenu
        wasUp = up; wasDown = down; wasA = a; wasB = b; wasMenu = menu
        return f
    }
}
