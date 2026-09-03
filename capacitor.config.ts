import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qracesso.app',
  appName: 'QR Acesso',
  webDir: 'www',
  server: {
    url: 'https://qracesso.vercel.app',
    cleartext: false
  }
};

export default config;
