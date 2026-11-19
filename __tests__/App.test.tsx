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
    setThemeAccent: jest.fn().mockResolvedValue(true),
    setOnboardingCompleted: jest.fn().mockResolvedValue(true),
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

test('allows switching themes in the Sanctuary Atmosphere showcase', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  // Skip intro to enter dashboard
  const skipTextNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Skip →');
  expect(skipTextNode).toBeDefined();

  // Find parent Pressable of skipTextNode to jump to slide 3
  let skipButton = skipTextNode!.parent;
  while (skipButton && !skipButton.props.onPress) {
    skipButton = skipButton.parent;
  }
  expect(skipButton).toBeDefined();
  await ReactTestRenderer.act(() => skipButton!.props.onPress());

  // Enter dashboard
  const enterBtnText = renderer!.root
    .findAllByType(Text)
    .find(
      node =>
        typeof node.props.children === 'string' &&
        node.props.children.includes('Dashboard →'),
    );
  expect(enterBtnText).toBeDefined();

  let enterBtn = enterBtnText!.parent;
  while (enterBtn && !enterBtn.props.onPress) {
    enterBtn = enterBtn.parent;
  }
  expect(enterBtn).toBeDefined();
  await ReactTestRenderer.act(() => enterBtn!.props.onPress());

  // Verify dashboard is shown
  const allTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(allTexts).toContain('ReelCount');

  // Find dock and slide to slot 3 (Settings tab)
  // Find dock tab for Settings
  const settingsTab = renderer!.root.findByProps({ testID: 'dock-tab-settings' });
  expect(settingsTab).toBeDefined();
  await ReactTestRenderer.act(() => settingsTab.props.onTouchEnd());

  // Verify Settings tab atmosphere showcase contains the 6 themes
  const settingsTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');

  expect(settingsTexts).toContain('Sanctuary Atmosphere');
  expect(settingsTexts).toContain('Obsidian Mint');
  expect(settingsTexts).toContain('Cyber Sky');
  expect(settingsTexts).toContain('Amethyst Aura');
  expect(settingsTexts).toContain('Solar Amber');
  expect(settingsTexts).toContain('Neon Rose');
  expect(settingsTexts).toContain('Pure Titanium');

  // Tap on "Neon Rose" theme card
  const roseTextNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Neon Rose');
  expect(roseTextNode).toBeDefined();

  let roseCardBtn = roseTextNode!.parent;
  while (roseCardBtn && !roseCardBtn.props.onPress) {
    roseCardBtn = roseCardBtn.parent;
  }
  expect(roseCardBtn).toBeDefined();
  await ReactTestRenderer.act(() => roseCardBtn!.props.onPress());

  // Assert PrototypeSettings.setThemeAccent was invoked with 'rose'
  expect(PrototypeSettings.setThemeAccent).toHaveBeenCalledWith('rose');

  await ReactTestRenderer.act(() => renderer!.unmount());
});
