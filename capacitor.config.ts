import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'QuizGame',
  webDir: 'www',
  plugins : {
    AdMob : {
      androidAppId: 'ca-app-pub-4874253778737753~9754157971',
    }
  }
};

export default config;
