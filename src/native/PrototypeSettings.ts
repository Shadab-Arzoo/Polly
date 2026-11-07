import { NativeModules } from 'react-native';

type PrototypeSettingsModule = {
  openAccessibilitySettings(): Promise<void>;
  getPrototypeStatus(): Promise<PrototypeStatus>;
};

export type PrototypeStatus = {
  serviceConnected: boolean;
  candidateCount: number;
  bufferedEventCount: number;
};

const { PrototypeSettings } = NativeModules as {
  PrototypeSettings?: PrototypeSettingsModule;
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
      });
    }
    return PrototypeSettings.getPrototypeStatus();
  },
};
