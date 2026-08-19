import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qracesso.studio',
  appName: 'qr-acesso-studio',
  webDir: 'www',
  server: {
    url: 'https://qr-acesso-studio.vercel.app',
    cleartext: false
  }
};

export default config;
