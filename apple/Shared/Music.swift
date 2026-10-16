import AVFoundation

/// Each venue's tune, looping — the same tracks as the web game
/// (soda-jerk-web/public/audio/music-<venue>.mp3: public-domain ragtime,
/// recorded fresh by tools/music/render-tracks.mjs).
final class Music {
    private var player: AVAudioPlayer?
    private var current: String?

    init() {
        // Ambient: plays alongside the player's own audio and respects the
        // silent switch, like most games.
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    /// Plays `venue`'s tune, switching only when the venue changes.
    func play(venue: String) {
        guard venue != current else { return }
        current = venue
        guard let url = Bundle.main.url(forResource: "music-\(venue)", withExtension: "mp3", subdirectory: "audio") else {
            print("missing music for", venue)
            player = nil
            return
        }
        player?.stop()
        player = try? AVAudioPlayer(contentsOf: url)
        player?.numberOfLoops = -1
        player?.volume = 0.5
        player?.play()
    }
}
