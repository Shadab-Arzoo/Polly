import { NativeModules } from 'react-native';

type PrototypeSettingsModule = {
  openAccessibilitySettings(): Promise<void>;
};

const { PrototypeSettings } = NativeModules as {
  PrototypeSettings: PrototypeSettingsModule;
};

export default PrototypeSettings;
