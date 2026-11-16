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
  onboardingCompleted?: boolean;
  hudStyle?: string;
  bedtimeShieldEnabled?: boolean;
  bedtimeShieldActive?: boolean;
  doomscrollAlertEnabled?: boolean;
  breakReminderEnabled?: boolean;
  speedbumpEnabled?: boolean;
  zenXp?: number;
  userIntention?: string;
  userMood?: string;
  triggerBoredom?: number;
  triggerStress?: number;
  triggerProcrastination?: number;
  triggerHabit?: number;
  triggerFomo?: number;
  instagramLimit?: number;
  tiktokLimit?: number;
  youtubeLimit?: number;
  snapchatLimit?: number;
  themeAccent?: string;
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
  setOnboardingCompleted(completed: boolean): Promise<boolean>;
  setHudStyle(style: string): Promise<boolean>;
  setBedtimeShield(
    enabled: boolean,
    startHour: number,
    endHour: number,
  ): Promise<boolean>;
  setDoomscrollAlert(enabled: boolean): Promise<boolean>;
  setBreakReminder(enabled: boolean): Promise<boolean>;
  playSoundscape(soundscape: string, durationMinutes: number): Promise<boolean>;
  stopSoundscape(): Promise<boolean>;
  isSoundscapePlaying(): Promise<boolean>;
  setSpeedbumpEnabled(enabled: boolean): Promise<boolean>;
  setPackageLimit(packageName: string, limit: number): Promise<boolean>;
  addZenXp(amount: number): Promise<number>;
  logTrigger(trigger: string): Promise<number>;
  setUserIntention(intention: string): Promise<boolean>;
  setUserMood(mood: string): Promise<boolean>;
  setThemeAccent(theme: string): Promise<boolean>;
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
  setOnboardingCompleted(completed: boolean): Promise<boolean> {
    if (!PrototypeSettings?.setOnboardingCompleted) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setOnboardingCompleted(completed);
  },
  setHudStyle(style: string): Promise<boolean> {
    if (!PrototypeSettings?.setHudStyle) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setHudStyle(style);
  },
  setBedtimeShield(
    enabled: boolean,
    startHour: number = 23,
    endHour: number = 6,
  ): Promise<boolean> {
    if (!PrototypeSettings?.setBedtimeShield) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setBedtimeShield(enabled, startHour, endHour);
  },
  setDoomscrollAlert(enabled: boolean): Promise<boolean> {
    if (!PrototypeSettings?.setDoomscrollAlert) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setDoomscrollAlert(enabled);
  },
  setBreakReminder(enabled: boolean): Promise<boolean> {
    if (!PrototypeSettings?.setBreakReminder) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setBreakReminder(enabled);
  },
  playSoundscape(
    soundscape: string,
    durationMinutes: number = 25,
  ): Promise<boolean> {
    if (!PrototypeSettings?.playSoundscape) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.playSoundscape(soundscape, durationMinutes);
  },
  stopSoundscape(): Promise<boolean> {
    if (!PrototypeSettings?.stopSoundscape) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.stopSoundscape();
  },
  isSoundscapePlaying(): Promise<boolean> {
    if (!PrototypeSettings?.isSoundscapePlaying) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.isSoundscapePlaying();
  },
  setSpeedbumpEnabled(enabled: boolean): Promise<boolean> {
    if (!PrototypeSettings?.setSpeedbumpEnabled) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setSpeedbumpEnabled(enabled);
  },
  setPackageLimit(packageName: string, limit: number): Promise<boolean> {
    if (!PrototypeSettings?.setPackageLimit) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setPackageLimit(packageName, limit);
  },
  addZenXp(amount: number): Promise<number> {
    if (!PrototypeSettings?.addZenXp) {
      return Promise.resolve(amount);
    }
    return PrototypeSettings.addZenXp(amount);
  },
  logTrigger(trigger: string): Promise<number> {
    if (!PrototypeSettings?.logTrigger) {
      return Promise.resolve(1);
    }
    return PrototypeSettings.logTrigger(trigger);
  },
  setUserIntention(intention: string): Promise<boolean> {
    if (!PrototypeSettings?.setUserIntention) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setUserIntention(intention);
  },
  setUserMood(mood: string): Promise<boolean> {
    if (!PrototypeSettings?.setUserMood) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setUserMood(mood);
  },
  setThemeAccent(theme: string): Promise<boolean> {
    if (!PrototypeSettings?.setThemeAccent) {
      return Promise.resolve(false);
    }
    return PrototypeSettings.setThemeAccent(theme);
  },
};
