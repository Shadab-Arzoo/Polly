import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import PrototypeSettings, {
  type PrototypeStatus,
} from './src/native/PrototypeSettings';

function App() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [settingsError, setSettingsError] = useState(false);
  const [prototypeStatus, setPrototypeStatus] = useState<PrototypeStatus>({
    serviceConnected: false,
    candidateCount: 0,
    bufferedEventCount: 0,
  });

  useEffect(() => {
    let mounted = true;
    const refreshStatus = () => {
      PrototypeSettings.getPrototypeStatus()
        .then(status => {
          if (mounted) {
            setPrototypeStatus(status);
          }
        })
        .catch(() => {});
    };
    refreshStatus();
    const interval = setInterval(refreshStatus, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const continueToSettings = async () => {
    if (!consentGiven) {
      return;
    }

    setSettingsError(false);
    try {
      await PrototypeSettings.openAccessibilitySettings();
    } catch {
      setSettingsError(true);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>REELCOUNT · PRE-RELEASE PROTOTYPE</Text>
          <Text style={styles.title}>Notice your short-video scrolling</Text>
          <Text style={styles.intro}>
            ReelCount is testing whether Android accessibility event metadata
            can help identify possible video transitions. It is an experiment,
            not a reliable counter or an accessibility tool.
          </Text>

          <View style={styles.statusSection} accessibilityLiveRegion="polite">
            <Text style={styles.sectionTitle}>Prototype status</Text>
            <Text style={styles.body}>
              {prototypeStatus.serviceConnected
                ? 'Accessibility service connected'
                : 'Accessibility service not active'}
            </Text>
            <Text style={styles.body}>
              Candidate transitions this service session: {prototypeStatus.candidateCount}
            </Text>
            <Text style={styles.body}>
              Temporary event metadata buffered: {prototypeStatus.bufferedEventCount}
            </Text>
            <Text style={styles.statusHint}>
              These temporary diagnostics reset when the service stops. Candidate values are
              experimental and are not reliable reel counts.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              What this prototype collects
            </Text>
            <Text style={styles.body}>
              Only the event type, package name, and event timestamp, and only
              when the package matches one of the four provisionally configured
              apps: Instagram, TikTok, Snapchat, or YouTube.
            </Text>
            <Text style={styles.body}>
              Events stay in a temporary in-memory diagnostic buffer and are
              discarded when the service stops or the app process ends. No
              traces or counts are saved.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What it does not collect</Text>
            <Text style={styles.body}>
              ReelCount does not read event text, screen content, accessibility
              UI trees, messages, passwords, or screenshots, and does not
              monitor unrelated apps.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Android 13+ Setup Note</Text>
            <Text style={styles.body}>
              If Android disables or greys out the service in Accessibility Settings,
              open Settings &gt; Apps &gt; ReelCount (Pre-release) &gt; ⋮ &gt; Allow restricted
              settings, then return to Accessibility Settings to turn it on.
            </Text>
          </View>

          <Text style={styles.note}>
            App identifiers and transition accuracy have not been verified on
            physical devices. Candidate transitions may be missed or duplicated;
            no count should be treated as reliable.
          </Text>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentGiven }}
            onPress={() => setConsentGiven(value => !value)}
            style={styles.consentRow}
          >
            <View
              style={[styles.checkbox, consentGiven && styles.checkboxChecked]}
            >
              {consentGiven ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>
              I understand this limited prototype and choose to continue to
              Android settings.
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !consentGiven }}
            disabled={!consentGiven}
            onPress={continueToSettings}
            style={[styles.button, !consentGiven && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              Continue to accessibility settings
            </Text>
          </Pressable>
          <Text style={styles.settingsHint}>
            The service remains off until you enable it in Android settings. You
            can turn it off there at any time.
          </Text>
          {settingsError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              Android accessibility settings could not be opened. Please try
              again.
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#14221e' },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },
  eyebrow: {
    color: '#9fbeaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#f2f5ef',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    marginTop: 18,
  },
  intro: { color: '#d0dbd3', fontSize: 16, lineHeight: 24, marginTop: 14 },
  statusSection: {
    backgroundColor: '#20312a',
    borderColor: '#40534a',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 24,
    padding: 16,
  },
  section: {
    borderTopColor: '#40534a',
    borderTopWidth: 1,
    marginTop: 26,
    paddingTop: 18,
  },
  sectionTitle: { color: '#f2f5ef', fontSize: 18, fontWeight: '700' },
  body: { color: '#d0dbd3', fontSize: 15, lineHeight: 23, marginTop: 10 },
  statusHint: { color: '#b7c5bc', fontSize: 13, lineHeight: 19, marginTop: 10 },
  note: {
    backgroundColor: '#26372f',
    borderLeftColor: '#e4b76c',
    borderLeftWidth: 3,
    color: '#f3e6cc',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 24,
    padding: 14,
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 26,
    minHeight: 52,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#9fbeaa',
    borderRadius: 3,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    width: 24,
  },
  checkboxChecked: { backgroundColor: '#b6d6bd', borderColor: '#b6d6bd' },
  checkmark: {
    color: '#14221e',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  consentText: { color: '#f2f5ef', flex: 1, fontSize: 15, lineHeight: 22 },
  button: {
    alignItems: 'center',
    backgroundColor: '#b6d6bd',
    borderRadius: 6,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  buttonDisabled: { backgroundColor: '#52635a' },
  buttonText: {
    color: '#14221e',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  settingsHint: {
    color: '#b7c5bc',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    textAlign: 'center',
  },
  error: { color: '#ffb4ab', fontSize: 14, lineHeight: 20, marginTop: 12 },
});

export default App;
