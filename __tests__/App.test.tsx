/** @format */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import PrototypeSettings from '../src/native/PrototypeSettings';

jest.mock('../src/native/PrototypeSettings', () => ({
  __esModule: true,
  default: { openAccessibilitySettings: jest.fn() },
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
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

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
});
