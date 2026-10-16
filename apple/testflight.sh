#!/bin/zsh
# Archives an app and uploads it to App Store Connect for TestFlight.
#
#   ./testflight.sh ios      # iPhone/iPad
#   ./testflight.sh tvos     # Apple TV
#
# Needs Xcode signed in to the team's account, and the app's record in App
# Store Connect (bundle ID com.spayce.sodajerk). Each upload gets a fresh
# build number from the clock, so they never collide. The archive is left
# unsigned and signed for distribution at export, so no registered test
# device is needed.
set -euo pipefail
cd "$(dirname "$0")"
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

case "${1:-ios}" in
  ios)  scheme=SodaJerk-iOS;  dest="generic/platform=iOS" ;;
  tvos) scheme=SodaJerk-tvOS; dest="generic/platform=tvOS" ;;
  *) echo "usage: $0 ios|tvos"; exit 1 ;;
esac

build=$(date +%Y%m%d%H%M)
archive="build/$scheme-$build.xcarchive"

xcodegen -q
xcodebuild -project SodaJerk.xcodeproj -scheme "$scheme" -destination "$dest" \
  -configuration Release -archivePath "$archive" -allowProvisioningUpdates \
  CURRENT_PROJECT_VERSION="$build" CODE_SIGNING_ALLOWED=NO archive
xcodebuild -exportArchive -archivePath "$archive" -exportPath "build/export-$scheme-$build" \
  -exportOptionsPlist ExportOptions-AppStore.plist -allowProvisioningUpdates
echo "Uploaded $scheme build $build — it shows in TestFlight once Apple finishes processing it."
