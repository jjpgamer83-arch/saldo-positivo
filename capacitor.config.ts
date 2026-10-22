import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meubolso.app',
  appName: 'MeuBolso',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
