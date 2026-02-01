/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    retries: 3
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/ComplianceApp.app',
      build: 'xcodebuild -workspace ios/ComplianceApp.xcworkspace -scheme ComplianceApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
'android.debug': {
  type: 'android.apk',
  binaryPath: 'C:/b/ComplianceApp/app/outputs/apk/debug/app-debug.apk',
  build: 'android\\gradlew.bat -p android assembleDebug assembleAndroidTest -DtestBuildType=debug',
  reversePorts: [8081]
},
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' }
    },
    emulator: {
      type: 'android.emulator',
      // Ensure this matches the name in your Android Studio Device Manager
      device: { avdName: 'Pixel_6_API_33' }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};