#!/bin/zsh
# Archives an app and uploads it to App Store Connect for TestFlight.
#
#   ./testflight.sh ios      # iPhone/iPad
#   ./testflight.sh tvos     # Apple TV
#
# Signs in to App Store Connect with the API key in ~/.appstoreconnect
# (config.json names it), so it doesn't depend on Xcode's own sign-in. The
# app's record is "The Soda Jerk", bundle ID com.vspayce.sodajerk.
#
# Each upload gets a fresh build number from the clock, so they never
# collide. The archive is left unsigned and signed for distribution at
# export, so no registered test device is needed.
set -euo pipefail
cd "$(dirname "$0")"
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

platform="${1:-ios}"
case "$platform" in
  ios)  scheme=SodaJerk-iOS;  dest="generic/platform=iOS" ;;
  tvos) scheme=SodaJerk-tvOS; dest="generic/platform=tvOS" ;;
  *) echo "usage: $0 ios|tvos"; exit 1 ;;
esac

cfg=~/.appstoreconnect/config.json
key_path=$(python3 -c "import json; print(json.load(open('$cfg'))['key_path'])")
key_id=$(python3 -c "import json; print(json.load(open('$cfg'))['key_id'])")
issuer=$(python3 -c "import json; print(json.load(open('$cfg'))['issuer_id'])")
auth=(-allowProvisioningUpdates -authenticationKeyPath "$key_path" -authenticationKeyID "$key_id" -authenticationKeyIssuerID "$issuer")

build=$(date +%Y%m%d%H%M)
archive="build/$scheme-$build.xcarchive"

xcodegen -q
xcodebuild -project SodaJerk.xcodeproj -scheme "$scheme" -destination "$dest" \
  -configuration Release -archivePath "$archive" "${auth[@]}" \
  CURRENT_PROJECT_VERSION="$build" CODE_SIGNING_ALLOWED=NO archive
xcodebuild -exportArchive -archivePath "$archive" -exportPath "build/export-$scheme-$build" \
  -exportOptionsPlist "ExportOptions-$platform.plist" "${auth[@]}"
echo "Uploaded $scheme build $build — it shows in TestFlight once Apple finishes processing it."
