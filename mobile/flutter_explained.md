## a) flutter run vs flutter run -d chrome  

- **flutter run** runs the app on the default selected device.  
-- Good when only one device is available.
  
- **flutter run -d chrome** runs the app in Chrome as a web app.  
-- Good for browser-based testing.

### Which is the default selected device?  

- if there is only one available device, flutter run uses that one
- if there are multiple devices, Flutter can prompt you to choose a target when you run flutter run

## b) flutter build apk --release vs flutter run --release

- **flutter build apk --release** builds a release APK file you can keep, share, or install later.  
-- It is for producing the app package.  
  
- **flutter run** --release builds in release mode and launches it on a connected target right away.  
-- It is for running/testing, not mainly for producing a distributable file.

### Practical summary:  
  
- want to test quickly in browser → **flutter run -d chrome**
- want to run on a connected device now → **flutter run**
- want an installable Android app file → **flutter build apk**  

## c) flutter run vs flutter run --release  

- **flutter run** runs in debug mode by default.  
-- Better for development, hot reload, debugging, and logs.  
  
- **flutter run --release** runs in release mode.  
-- Better for checking near-real performance/behavior, but debugging features are stripped or disabled.  
-- On mobile, release mode disables assertions, removes debug info, and optimizes for startup, execution, and smaller package size.  

### Practical use:  

- use **flutter run** while building the app  
- use **flutter run --release** when you want to test how it behaves closer to the final app on a real device  

## d) When to use flutter clean  

- **flutter clean** deletes generated build/output folders,  
-- specifically build/ and .dart_tool/. Flutter’s CLI reference states that directly.  

- Use it when builds act weird or stale, or when they do not rebuild correctly  
- Do not use it every time by default, because it removes cached/generated artifacts and makes the next build slower.  
- Typical flow  
```
flutter clean
flutter pub get
flutter run
or
flutter build apk  
```  

## e) When to run flutter pub get  

- Run **flutter pub get** when your project needs to fetch or refresh dependencies from pubspec.yaml.  

- Common times:  

-- right after flutter create  
-- after adding, removing, or changing a package in pubspec.yaml  
-- after pulling a project from Git for the first time  
-- after flutter clean, if dependencies/generated state need to be restored  
-- when Flutter tells you packages are missing or out of sync  

```
flutter create ex00
cd ex00
flutter pub get
flutter run -d chrome
```
 
## f) flutter create xyz vs dart create xyz

- flutter create xyz creates a Flutter project.  
-- Use this when you want a Flutter app, with Flutter-specific folders like android/, ios/, web/, and Flutter app scaffolding.  

- dart create xyz creates a plain Dart project from a Dart template, such as a console app or package.  
-- It is not the normal command for creating a Flutter app. dart create also fetches dependencies unless you pass --no-pub.

## f) flutter run vs dart run  

- **flutter run** Builds and launches a Flutter UI app on a device/emulator.  
-- Target: Android, iOS, Web, macOS, Windows, Linux.  
-- Dependencies: Requires the Flutter framework (package:flutter).  
-- Use Case: Developing a mobile app or a website.  

- **dart run** Executes a Dart script or a server-side app in the Dart VM.  
-- Target: The local terminal/console.  
-- Dependencies: Requires only the Dart SDK.  
-- Use Case: Running a command-line tool or backend script.  

## g) Flutter launcher icon workflow

- Use flutter_launcher_icons. It changes the icon that appears after flutter build apk.
- Add icon file
```
ex00/
├── assets/
│   └── icon/
│       └── app_icon.png
```
- Use a square PNG, preferably: 1024 x 1024

- Edit pubspec.yaml
```
dev_dependencies:
  flutter_launcher_icons: ^0.14.4

flutter_launcher_icons:
  android: true
  ios: false
  image_path: "assets/icon/app_icon.png"
  min_sdk_android: 21
  ```
  Run:
  ```
  cd ex00

  flutter pub get
  dart run flutter_launcher_icons
  flutter clean
  flutter build apk --release
  ```

  - APK will be generated around:
  
    build/app/outputs/flutter-apk/app-release.apk

