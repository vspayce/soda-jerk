import AVFoundation

/// Each venue's tune, looping — the same tracks as the web game
/// (soda-jerk-web/public/audio/music-<venue>.mp3: public-domain ragtime,
/// recorded fresh by tools/music/render-tracks.mjs) — with the web's volume
/// setting and mute button, both remembered between launches.
final class Music {
    private var player: AVAudioPlayer?
    private var current: String?
    private let defaults = UserDefaults.standard

    /// 0–1, as the settings slider sets it (the web's default is 0.22).
    var volume: Float {
        didSet { defaults.set(volume, forKey: "soda-jerk-volume"); apply() }
    }
    var isMuted: Bool {
        didSet { defaults.set(isMuted, forKey: "soda-jerk-muted"); apply() }
    }

    init() {
        volume = defaults.object(forKey: "soda-jerk-volume") as? Float ?? 0.22
        isMuted = defaults.bool(forKey: "soda-jerk-muted")
        // Ambient: plays alongside the player's own audio and respects the
        // silent switch, like most games.
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    /// Plays `venue`'s tune, switching only when the venue changes.
    func play(venue: String) {
        guard venue != current else {
            if player?.isPlaying == false { player?.play() }
            return
        }
        current = venue
        guard let url = Bundle.main.url(forResource: "music-\(venue)", withExtension: "mp3", subdirectory: "audio") else {
            print("missing music for", venue)
            player = nil
            return
        }
        player?.stop()
        player = try? AVAudioPlayer(contentsOf: url)
        player?.numberOfLoops = -1
        apply()
        player?.play()
    }

    /// The fountain's closed once the game ends — the music stops with it.
    func stop() {
        player?.stop()
        player?.currentTime = 0
        current = nil
    }

    private func apply() { player?.volume = isMuted ? 0 : volume }
}
