import AVFoundation

/// One-shot sound effects (the web's audio/sfx.js): three recordings from
/// public/audio, and the hot-dog arpeggio, synthesized here the same way
/// the web builds it (C5 E5 G5 C6 on a triangle wave, 70ms apart).
final class Sfx {
    private var players: [AVAudioPlayer] = []
    private lazy var celebration: Data = Sfx.arpeggio()

    func seltzerSpray() { play(file: "siphon_spray") }
    func glassShatter() { play(file: "glass-drop-shatter-short") }
    func crash() { play(file: "glasses-off-table-crash") }
    func celebrate() { play(data: celebration) }

    private func play(file: String) {
        guard let url = Bundle.main.url(forResource: file, withExtension: "mp3", subdirectory: "audio"),
              let p = try? AVAudioPlayer(contentsOf: url) else { return }
        start(p)
    }
    private func play(data: Data) {
        guard let p = try? AVAudioPlayer(data: data) else { return }
        start(p)
    }
    private func start(_ p: AVAudioPlayer) {
        p.volume = 0.8
        p.play()
        players.removeAll { !$0.isPlaying }
        players.append(p)
    }

    private static func arpeggio() -> Data {
        let rate = 44100.0
        let notes = [523.25, 659.25, 783.99, 1046.5]
        let total = Int(rate * (0.07 * 3 + 0.26))
        var samples = [Float](repeating: 0, count: total)
        for (i, f) in notes.enumerated() {
            let start = Int(rate * 0.07 * Double(i))
            for k in 0..<Int(rate * 0.24) where start + k < total {
                let t = Double(k) / rate
                let tri = 2 * abs(2 * (t * f - floor(t * f + 0.5))) - 1
                // exponential up to 0.3 over 20ms, down by 220ms
                let env = t < 0.02 ? 0.0001 * pow(3000, t / 0.02) : 0.3 * pow(0.0001 / 0.3, (t - 0.02) / 0.2)
                samples[start + k] += Float(tri * min(env, 0.3))
            }
        }
        var d = Data()
        func u32(_ v: UInt32) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        func u16(_ v: UInt16) { withUnsafeBytes(of: v.littleEndian) { d.append(contentsOf: $0) } }
        d.append(contentsOf: Array("RIFF".utf8)); u32(UInt32(36 + total * 2)); d.append(contentsOf: Array("WAVE".utf8))
        d.append(contentsOf: Array("fmt ".utf8)); u32(16); u16(1); u16(1); u32(44100); u32(88200); u16(2); u16(16)
        d.append(contentsOf: Array("data".utf8)); u32(UInt32(total * 2))
        for s in samples { u16(UInt16(bitPattern: Int16(max(-1, min(1, s)) * 32767))) }
        return d
    }
}
