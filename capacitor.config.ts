import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myapp',
  appName: 'InWise',
  webDir: 'public',
  server: {
    url: 'https://inwise.vercel.app',
    cleartext: true
  }
};

export default config;
