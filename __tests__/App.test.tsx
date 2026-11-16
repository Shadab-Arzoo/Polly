/** @format */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import PrototypeSettings from '../src/native/PrototypeSettings';

jest.mock('../src/native/PrototypeSettings', () => ({
  __esModule: true,
  default: {
    openAccessibilitySettings: jest.fn(),
    getPrototypeStatus: jest.fn().mockResolvedValue({
      serviceConnected: true,
      candidateCount: 2,
      bufferedEventCount: 4,
      instagramCount: 1,
      tiktokCount: 1,
      youtubeCount: 0,
      snapchatCount: 0,
      dailyShortLimit: 50,
      focusModeActive: false,
    }),
    getDailyHistory: jest.fn().mockResolvedValue([
      { date: '2026-11-15', label: 'Today', count: 2 },
    ]),
    setFocusMode: jest.fn().mockResolvedValue(true),
    setDailyLimits: jest.fn().mockResolvedValue(true),
    resetCounters: jest.fn().mockResolvedValue(null),
  },
  TARGET_PACKAGES: {
    INSTAGRAM: 'com.instagram.android',
    TIKTOK: 'com.zhiliaoapp.musically',
    YOUTUBE: 'com.google.android.youtube',
    SNAPCHAT: 'com.snapchat.android',
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const mockReact = require('react') as typeof import('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: import('react').ReactNode }) =>
      mockReact.createElement(ReactNative.View, null, children),
    SafeAreaView: ReactNative.View,
  };
});

test('requires an explicit opt-in before opening Android accessibility settings', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(
    renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity)
      .join(''),
  ).toContain('Session scroll events detected: 2');

  const checkbox = renderer!.root.findByProps({
    accessibilityRole: 'checkbox',
  });
  const continueButton = renderer!.root.findByProps({
    accessibilityRole: 'button',
  });
  expect(continueButton.props.disabled).toBe(true);
  await ReactTestRenderer.act(() => continueButton.props.onPress());
  expect(PrototypeSettings.openAccessibilitySettings).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => checkbox.props.onPress());
  expect(continueButton.props.disabled).toBe(false);
  await ReactTestRenderer.act(() => continueButton.props.onPress());
  expect(PrototypeSettings.openAccessibilitySettings).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(() => renderer!.unmount());
});
