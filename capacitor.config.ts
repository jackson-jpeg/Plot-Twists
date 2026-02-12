import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.test.plottwists.app',
  appName: 'Plot Twists',
  webDir: 'public',

  // Load the live production URL (not bundled static files)
  server: {
    url: 'https://plot-twists.com',
    allowNavigation: [
      'plot-twists.com',
      '*.plot-twists.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
      'web-production-c7981.up.railway.app',
    ],
  },

  ios: {
    scheme: 'PlotTwists',
    backgroundColor: '#FDFCFA',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },

}

export default config
