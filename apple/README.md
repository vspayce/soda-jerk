# Soda Jerk for iPhone and Apple TV

One Xcode project, two apps (`SodaJerk-iOS`, `SodaJerk-tvOS`), sharing all
their code in `Shared/`.

## How it fits together

The game's rules are the web game's own — `soda-jerk-web/src/game/engine.js`
and what it imports. `npm run build:engine` (in `soda-jerk-web`) bundles them
into `Shared/engine.js`, which the apps run in JavaScriptCore
(`Engine.swift`). The apps only draw (SpriteKit) and read the controls. Change
a rule in `src/game` and the web game, the iPhone app and the Apple TV app
all pick it up; every Xcode build re-bundles it first.

The art is `soda-jerk-web/public/art`, copied into the apps as-is. There's
no music in the apps.

## Build

    brew install xcodegen      # once
    cd apple && xcodegen       # writes SodaJerk.xcodeproj (not committed)
    open SodaJerk.xcodeproj

Pick `SodaJerk-tvOS` or `SodaJerk-iOS` and your device, then Run. Signing is
automatic with team 2TJY362VLX.

To start straight on the bar without a controller (handy in the simulator),
add `-autostart` to the scheme's launch arguments; `-venue N` also skips
ahead N venues.

## Controls

| | Game controller | Siri Remote | Keyboard | iPhone |
|---|---|---|---|---|
| Change bar | D-pad / stick up, down | swipe up, down | ↑ ↓ (W S) | tap the bar |
| Run along the bar | D-pad / stick left, right | swipe left, right | ← → (A D) | drag left, right |
| Pour orange | A | click | Space / Z / Return | orange tap |
| Pour pink | B or X | Play/Pause | X | pink tap |
| Pause | Menu / Options | Menu | Esc / P | — |
| Continue on a screen | A | click | Space | tap |

## Not in the apps yet

The bonus rounds (they're skipped for now), the jerk's between-level trick,
sound effects, the door swing and the patrons' turn to watch the show.

## TestFlight

    ./testflight.sh ios     # or tvos

archives a Release build, signs it for distribution and uploads it to App
Store Connect, with a build number from the clock. The app record
(com.vspayce.sodajerk) has to exist in App Store Connect first.
