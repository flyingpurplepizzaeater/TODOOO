import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.collabboard.todooo',
  appName: 'TODOOO',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,        // Hide native splash immediately
      launchAutoHide: false,        // Manual hide after web animation
      backgroundColor: '#14b8a6',   // Teal brand color
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#14b8a6',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#14b8a6',
    },
  },
};

export default config;
