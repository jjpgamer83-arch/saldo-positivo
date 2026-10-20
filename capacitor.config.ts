import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saldopositivo.finance',
  appName: 'Saldo Positivo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
