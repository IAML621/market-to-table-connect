
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a31cbc41b0b54c30ab222bf8b7d7f298',
  appName: 'market-to-table-connect',
  webDir: 'dist',
  server: {
    url: "https://a31cbc41-b0b5-4c30-ab22-2bf8b7d7f298.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4CAF50",
      showSpinner: true,
      spinnerColor: "#FFFFFF"
    }
  }
};

export default config;
