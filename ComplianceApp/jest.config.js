module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|supabase-js|@react-native-async-storage/async-storage|@supabase/.*)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}'
  ],
};