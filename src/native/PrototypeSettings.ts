import { NativeModules } from 'react-native';

export type PrototypeStatus = {
  serviceConnected: boolean;
  candidateCount: number;
  bufferedEventCount: number;
  instagramCount?: number;
  tiktokCount?: number;
  youtubeCount?: number;
  snapchatCount?: number;
  focusModeActive?: boolean;
  focusRemainingSeconds?: number;
  dailyShortLimit?: number;
  dailyTimeLimitMinutes?: number;
};

export type DayHistoryItem = {
  date: string;
  label: string;
  count: number;
};

type PrototypeSettingsModule = {
  openAccessibilitySettings(): Promise<void>;
  getPrototypeStatus(): Promise<PrototypeStatus>;
  resetCounters(): Promise<void>;
  setFocusMode(
    active: boolean,
    durationMinutes: number,
    blockedPackages: string[],
  ): Promise<boolean>;
  setDailyLimits(
    shortLimit: number,
    timeLimitMinutes: number,
  ): Promise<boolean>;
  getDailyHistory(): Promise<DayHistoryItem[]>;
};

const { PrototypeSettings } = NativeModules as {
  PrototypeSettings?: PrototypeSettingsModule;
};

export const TARGET_PACKAGES = {
  INSTAGRAM: 'com.instagram.android',
  TIKTOK: 'com.zhiliaoapp.musically',
  YOUTUBE: 'com.google.android.youtube',
  SNAPCHAT: 'com.snapchat.android',
};

export default {
  openAccessibilitySettings(): Promise<void> {
    if (!PrototypeSettings?.openAccessibilitySettings) {
      return Promise.reject(
        new Error('PrototypeSettings native module is not available'),
      );
    }
    return PrototypeSettings.openAccessibilitySettings();
  },
  getPrototypeStatus(): Promise<PrototypeStatus> {
    if (!PrototypeSettings?.getPrototypeStatus) {
      return Promise.resolve({
        serviceConnected: false,
        candidateCount: 0,
        bufferedEventCount: 0,
        instagramCount: 0,
        tiktokCount: 0,
        youtubeCount: 0,
        snapchatCount: 0,
        focusModeActive: false,
        focusRemainingSeconds: 0,
        dailyShortLimit: 50,
        dailyTimeLimitMinutes: 30,
      });
    }
    return PrototypeSettings.getPrototypeStatus();
  },
  resetCounters(): Promise<void> {
    if (!PrototypeSettings?.resetCounters) {
      return Promise.resolve();
    }
    return PrototypeSettings.resetCounters();
  },
  setFocusMode(
    active: boolean,
    durationMinutes: number,
    blockedPackages: string[],
  ): Promise<boolean> {
    if (!PrototypeSettings?.setFocusMode) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setFocusMode(
      active,
      durationMinutes,
      blockedPackages,
    );
  },
  setDailyLimits(
    shortLimit: number,
    timeLimitMinutes: number,
  ): Promise<boolean> {
    if (!PrototypeSettings?.setDailyLimits) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setDailyLimits(shortLimit, timeLimitMinutes);
  },
  getDailyHistory(): Promise<DayHistoryItem[]> {
    if (!PrototypeSettings?.getDailyHistory) {
      return Promise.resolve([]);
    }
    return PrototypeSettings.getDailyHistory();
  },
};
