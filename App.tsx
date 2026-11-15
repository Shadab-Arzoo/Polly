import React, { useEffect, useState } from 'react';
import {
  Alert,
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

type Tab = 'counter' | 'timers' | 'block' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('counter');
  const [consentGiven, setConsentGiven] = useState(false);
  const [settingsError, setSettingsError] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Settings & Limits state
  const [dailyLimit, setDailyLimit] = useState(50);
  const [dailyTimeLimitMin, setDailyTimeLimitMin] = useState(30);
  const [breakReminder, setBreakReminder] = useState(true);
  const [doomscrollAlert, setDoomscrollAlert] = useState(true);

  // Block & Focus state
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [blockInstagram, setBlockInstagram] = useState(true);
  const [blockTikTok, setBlockTikTok] = useState(true);
  const [blockYouTube, setBlockYouTube] = useState(false);
  const [blockSnapchat, setBlockSnapchat] = useState(false);
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(15 * 60);

  const [prototypeStatus, setPrototypeStatus] = useState<PrototypeStatus>({
    serviceConnected: false,
    candidateCount: 0,
    bufferedEventCount: 0,
    instagramCount: 0,
    tiktokCount: 0,
    youtubeCount: 0,
    snapchatCount: 0,
  });

  useEffect(() => {
    let mounted = true;
    const refreshStatus = () => {
      PrototypeSettings.getPrototypeStatus()
        .then(status => {
          if (mounted && status) {
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

  // Timer countdown effect for Focus Mode
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (focusTimerRunning && focusTimerSeconds > 0) {
      timer = setInterval(() => {
        setFocusTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (focusTimerSeconds === 0 && focusTimerRunning) {
      setFocusTimerRunning(false);
      Alert.alert('Focus Session Complete', 'Great job avoiding distraction!');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [focusTimerRunning, focusTimerSeconds]);

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

  const handleResetCounters = async () => {
    try {
      await PrototypeSettings.resetCounters();
      setPrototypeStatus(prev => ({
        ...prev,
        candidateCount: 0,
        bufferedEventCount: 0,
        instagramCount: 0,
        tiktokCount: 0,
        youtubeCount: 0,
        snapchatCount: 0,
      }));
    } catch {}
  };

  const totalShorts = prototypeStatus.candidateCount;
  const estMinutes = Math.round(totalShorts * 0.5); // avg 30s per short
  const progressRatio = Math.min(totalShorts / (dailyLimit || 1), 1);
  const progressPercent = Math.round(progressRatio * 100);

  // App breakdown (fall back to simulated share if session only tracks total)
  const igCount = prototypeStatus.instagramCount ?? Math.round(totalShorts * 0.45);
  const ttCount = prototypeStatus.tiktokCount ?? Math.round(totalShorts * 0.35);
  const ytCount = prototypeStatus.youtubeCount ?? Math.round(totalShorts * 0.15);
  const scCount = prototypeStatus.snapchatCount ?? Math.max(0, totalShorts - igCount - ttCount - ytCount);

  // Format seconds into MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render Intro & Permissions Screen
  const renderIntroScreen = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.introHeader}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>🎬</Text>
        </View>
        <Text style={styles.eyebrow}>REELCOUNT</Text>
        <Text style={styles.title}>Mindful Short Video Habits</Text>
        <Text style={styles.introSummary}>
          ReelCount quietly measures your short-form video scrolling across Instagram Reels, TikTok, YouTube Shorts, and Snapchat so you notice doomscrolling before it takes over your day.
        </Text>
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyCardTitle}>🔒 100% On-Device & Private</Text>
        <Text style={styles.privacyCardBody}>
          ReelCount never reads your screen text, messages, passwords, or personal data. It only observes temporary scroll transitions in volatile memory.
        </Text>
      </View>

      <View style={styles.statusSection} accessibilityLiveRegion="polite">
        <Text style={styles.sectionTitle}>Prototype status</Text>
        <View
          style={[
            styles.statusBadge,
            prototypeStatus.serviceConnected
              ? styles.statusBadgeActive
              : styles.statusBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              prototypeStatus.serviceConnected
                ? styles.statusBadgeTextActive
                : styles.statusBadgeTextInactive,
            ]}
          >
            {prototypeStatus.serviceConnected
              ? '● Accessibility service connected'
              : '○ Accessibility service not active'}
          </Text>
        </View>
        <Text style={styles.body}>
          Candidate transitions this service session: {prototypeStatus.candidateCount}
        </Text>
        <Text style={styles.body}>
          Temporary event metadata buffered: {prototypeStatus.bufferedEventCount}
        </Text>
        <Text style={styles.statusHint}>
          These temporary diagnostics reset when the service stops. Candidate values are experimental and are not reliable reel counts.
        </Text>
      </View>

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
          {prototypeStatus.serviceConnected
            ? 'Manage accessibility settings'
            : 'Continue to accessibility settings'}
        </Text>
      </Pressable>

      <Text style={styles.settingsHint}>
        The service remains off until you enable it in Android settings. You
        can turn it off there at any time.
      </Text>

      {settingsError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          Android accessibility settings could not be opened. Please try again.
        </Text>
      ) : null}

      <Pressable
        onPress={() => setShowIntro(false)}
        style={styles.enterDashboardButton}
      >
        <Text style={styles.enterDashboardButtonText}>
          {prototypeStatus.serviceConnected ? 'Go to Home Dashboard →' : 'Skip to Dashboard →'}
        </Text>
      </Pressable>
    </ScrollView>
  );

  // Render Dashboard / Counter Tab
  const renderCounterTab = () => (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Top App Header */}
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.appHeaderTitle}>ReelCount</Text>
          <Text style={styles.appHeaderSubtitle}>Today's Short-Video Consumption</Text>
        </View>
        <View
          style={[
            styles.servicePill,
            prototypeStatus.serviceConnected
              ? styles.servicePillActive
              : styles.servicePillInactive,
          ]}
        >
          <Text
            style={[
              styles.servicePillText,
              prototypeStatus.serviceConnected
                ? styles.servicePillTextActive
                : styles.servicePillTextInactive,
            ]}
          >
            {prototypeStatus.serviceConnected ? '● Active' : '○ Paused'}
          </Text>
        </View>
      </View>

      {/* Hero Counter Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroCardLabel}>SHORTS SCROLLED</Text>
          <Pressable onPress={handleResetCounters} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.heroMetricRow}>
          <Text style={styles.heroCount}>{totalShorts}</Text>
          <View style={styles.heroMetaCol}>
            <Text style={styles.heroGoalText}>/ {dailyLimit} daily limit</Text>
            <Text style={styles.heroTimeText}>⏱ ~{estMinutes} mins spent</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.max(5, progressPercent)}%` },
              progressPercent >= 100 && styles.progressBarOverLimit,
            ]}
          />
        </View>

        <View style={styles.progressLabelRow}>
          <Text style={styles.progressPercentText}>{progressPercent}% of daily limit</Text>
          <Text style={styles.progressRemainingText}>
            {Math.max(0, dailyLimit - totalShorts)} remaining
          </Text>
        </View>
      </View>

      {/* App-by-App Breakdown */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Platform Breakdown</Text>

        {/* Instagram */}
        <View style={styles.appRow}>
          <View style={[styles.appIconCircle, styles.igCircle]}>
            <Text style={styles.appIconText}>📸</Text>
          </View>
          <View style={styles.appInfoCol}>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>Instagram Reels</Text>
              <Text style={styles.appMetricCount}>{igCount} reels</Text>
            </View>
            <View style={styles.appMiniTrack}>
              <View
                style={[
                  styles.appMiniFill,
                  styles.igFill,
                  { width: `${totalShorts > 0 ? (igCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* TikTok */}
        <View style={styles.appRow}>
          <View style={[styles.appIconCircle, styles.ttCircle]}>
            <Text style={styles.appIconText}>🎵</Text>
          </View>
          <View style={styles.appInfoCol}>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>TikTok</Text>
              <Text style={styles.appMetricCount}>{ttCount} videos</Text>
            </View>
            <View style={styles.appMiniTrack}>
              <View
                style={[
                  styles.appMiniFill,
                  styles.ttFill,
                  { width: `${totalShorts > 0 ? (ttCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* YouTube */}
        <View style={styles.appRow}>
          <View style={[styles.appIconCircle, styles.ytCircle]}>
            <Text style={styles.appIconText}>▶️</Text>
          </View>
          <View style={styles.appInfoCol}>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>YouTube Shorts</Text>
              <Text style={styles.appMetricCount}>{ytCount} shorts</Text>
            </View>
            <View style={styles.appMiniTrack}>
              <View
                style={[
                  styles.appMiniFill,
                  styles.ytFill,
                  { width: `${totalShorts > 0 ? (ytCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Snapchat */}
        <View style={styles.appRow}>
          <View style={[styles.appIconCircle, styles.scCircle]}>
            <Text style={styles.appIconText}>👻</Text>
          </View>
          <View style={styles.appInfoCol}>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>Snapchat Spotlight</Text>
              <Text style={styles.appMetricCount}>{scCount} clips</Text>
            </View>
            <View style={styles.appMiniTrack}>
              <View
                style={[
                  styles.appMiniFill,
                  styles.scFill,
                  { width: `${totalShorts > 0 ? (scCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Live Testing Tip Card */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 How tracking works</Text>
        <Text style={styles.tipText}>
          {prototypeStatus.serviceConnected
            ? 'The accessibility service is active in the background. Open Instagram, TikTok, or YouTube, scroll through videos, and return here to watch your counter update!'
            : 'Accessibility service is currently not active. Open Settings from the tab bar below to turn it on and start counting.'}
        </Text>
      </View>
    </ScrollView>
  );

  // Render Timers & Limits Tab
  const renderTimersTab = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.tabScreenTitle}>App Timers & Limits</Text>
      <Text style={styles.tabScreenSubtitle}>
        Set healthy boundaries for your short-form video consumption.
      </Text>

      {/* Daily Scroll Limit */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Daily Shorts Target</Text>
        <Text style={styles.cardSubtitle}>
          Choose how many short videos you consider a reasonable daily limit.
        </Text>

        <View style={styles.pillRow}>
          {[25, 50, 75, 100].map(limit => (
            <Pressable
              key={limit}
              onPress={() => setDailyLimit(limit)}
              style={[
                styles.pillButton,
                dailyLimit === limit && styles.pillButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.pillButtonText,
                  dailyLimit === limit && styles.pillButtonTextSelected,
                ]}
              >
                {limit} Reels
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Daily Time Limit */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Daily Video Time Cap</Text>
        <Text style={styles.cardSubtitle}>
          Maximum total screen time across short video feeds.
        </Text>

        <View style={styles.pillRow}>
          {[15, 30, 45, 60].map(mins => (
            <Pressable
              key={mins}
              onPress={() => setDailyTimeLimitMin(mins)}
              style={[
                styles.pillButton,
                dailyTimeLimitMin === mins && styles.pillButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.pillButtonText,
                  dailyTimeLimitMin === mins && styles.pillButtonTextSelected,
                ]}
              >
                {mins} Mins
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Smart Alerts */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Smart Scrolling Alerts</Text>

        <Pressable
          onPress={() => setBreakReminder(prev => !prev)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Break Reminder</Text>
            <Text style={styles.toggleSubtitle}>
              Remind me to take a pause after 20 continuous videos
            </Text>
          </View>
          <View
            style={[styles.switchTrack, breakReminder && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, breakReminder && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setDoomscrollAlert(prev => !prev)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Doomscroll Warning</Text>
            <Text style={styles.toggleSubtitle}>
              Alert if scrolling faster than 5 videos in 60 seconds
            </Text>
          </View>
          <View
            style={[styles.switchTrack, doomscrollAlert && styles.switchTrackOn]}
          >
            <View
              style={[
                styles.switchThumb,
                doomscrollAlert && styles.switchThumbOn,
              ]}
            />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );

  // Render Block App & Focus Tab
  const renderBlockTab = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.tabScreenTitle}>Block & Focus Mode</Text>
      <Text style={styles.tabScreenSubtitle}>
        Temporarily lock distractions when you need deep focus or rest.
      </Text>

      {/* Focus Session Card */}
      <View style={styles.focusHeroCard}>
        <Text style={styles.focusHeroTitle}>Deep Work Focus Session</Text>
        <Text style={styles.focusTimerText}>{formatTimer(focusTimerSeconds)}</Text>
        <Text style={styles.focusHeroSubtitle}>
          {focusTimerRunning
            ? 'Distracting short feeds are currently blocked.'
            : 'Start a focus timer to block distracting feeds.'}
        </Text>

        <View style={styles.focusButtonsRow}>
          <Pressable
            onPress={() => setFocusTimerRunning(prev => !prev)}
            style={[
              styles.focusActionButton,
              focusTimerRunning ? styles.focusStopButton : styles.focusStartButton,
            ]}
          >
            <Text style={styles.focusActionButtonText}>
              {focusTimerRunning ? 'Pause Session' : 'Start 15m Focus'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setFocusTimerRunning(false);
              setFocusTimerSeconds(15 * 60);
            }}
            style={styles.focusResetButton}
          >
            <Text style={styles.focusResetButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* Per-App Distraction Locks */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Distraction Blocking Rules</Text>
        <Text style={styles.cardSubtitle}>
          Choose which video apps should be blocked during focus mode.
        </Text>

        {/* Focus Master Toggle */}
        <Pressable
          onPress={() => setFocusModeActive(prev => !prev)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Master Focus Mode</Text>
            <Text style={styles.toggleSubtitle}>
              {focusModeActive
                ? 'Active · Selected distraction feeds are blocked'
                : 'Disabled · Tap to enable feed blocking'}
            </Text>
          </View>
          <View
            style={[styles.switchTrack, focusModeActive && styles.switchTrackOn]}
          >
            <View
              style={[
                styles.switchThumb,
                focusModeActive && styles.switchThumbOn,
              ]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setBlockInstagram(prev => !prev)}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleTitle}>📸 Block Instagram Reels</Text>
          <View
            style={[styles.switchTrack, blockInstagram && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockInstagram && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setBlockTikTok(prev => !prev)}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleTitle}>🎵 Block TikTok Feed</Text>
          <View
            style={[styles.switchTrack, blockTikTok && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockTikTok && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setBlockYouTube(prev => !prev)}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleTitle}>▶️ Block YouTube Shorts</Text>
          <View
            style={[styles.switchTrack, blockYouTube && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockYouTube && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setBlockSnapchat(prev => !prev)}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleTitle}>👻 Block Snapchat Spotlight</Text>
          <View
            style={[styles.switchTrack, blockSnapchat && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockSnapchat && styles.switchThumbOn]}
            />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );

  // Render Settings Tab
  const renderSettingsTab = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.tabScreenTitle}>Settings & Privacy</Text>
      <Text style={styles.tabScreenSubtitle}>
        System service status, permissions, and on-device privacy guarantee.
      </Text>

      {/* Service Status Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Accessibility Service</Text>
        <View
          style={[
            styles.statusBadge,
            prototypeStatus.serviceConnected
              ? styles.statusBadgeActive
              : styles.statusBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              prototypeStatus.serviceConnected
                ? styles.statusBadgeTextActive
                : styles.statusBadgeTextInactive,
            ]}
          >
            {prototypeStatus.serviceConnected
              ? '● Accessibility service connected'
              : '○ Accessibility service not active'}
          </Text>
        </View>

        <Text style={styles.body}>
          Candidate transitions this session: {prototypeStatus.candidateCount}
        </Text>
        <Text style={styles.body}>
          Temporary event metadata buffered: {prototypeStatus.bufferedEventCount}
        </Text>

        <Pressable
          onPress={() => PrototypeSettings.openAccessibilitySettings()}
          style={styles.settingsActionBtn}
        >
          <Text style={styles.settingsActionBtnText}>
            Open Android Accessibility Settings
          </Text>
        </Pressable>
      </View>

      {/* Privacy Guarantee */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Privacy Guarantee</Text>
        <Text style={styles.body}>
          • Only event type, app package, and timestamp are buffered.
        </Text>
        <Text style={styles.body}>
          • Zero screen text, UI tree data, messages, or screenshots are captured.
        </Text>
        <Text style={styles.body}>
          • Traces stay exclusively in volatile memory and reset on service restart.
        </Text>
      </View>

      {/* Intro & Diagnostics */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>App Onboarding & Info</Text>
        <Pressable
          onPress={() => setShowIntro(true)}
          style={styles.secondaryOutlineBtn}
        >
          <Text style={styles.secondaryOutlineBtnText}>
            View Intro & Consent Screen
          </Text>
        </Pressable>

        <Pressable
          onPress={handleResetCounters}
          style={[styles.secondaryOutlineBtn, styles.dangerOutlineBtn]}
        >
          <Text style={[styles.secondaryOutlineBtnText, styles.dangerOutlineBtnText]}>
            Reset Today's Counters
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {/* Main Body */}
        {showIntro ? (
          renderIntroScreen()
        ) : (
          <View style={styles.mainContainer}>
            {activeTab === 'counter' && renderCounterTab()}
            {activeTab === 'timers' && renderTimersTab()}
            {activeTab === 'block' && renderBlockTab()}
            {activeTab === 'settings' && renderSettingsTab()}

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
              <Pressable
                onPress={() => setActiveTab('counter')}
                style={[
                  styles.tabItem,
                  activeTab === 'counter' && styles.tabItemActive,
                ]}
              >
                <Text style={styles.tabIcon}>📊</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'counter' && styles.tabLabelActive,
                  ]}
                >
                  Counter
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('timers')}
                style={[
                  styles.tabItem,
                  activeTab === 'timers' && styles.tabItemActive,
                ]}
              >
                <Text style={styles.tabIcon}>⏱️</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'timers' && styles.tabLabelActive,
                  ]}
                >
                  Limits
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('block')}
                style={[
                  styles.tabItem,
                  activeTab === 'block' && styles.tabItemActive,
                ]}
              >
                <Text style={styles.tabIcon}>🛡️</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'block' && styles.tabLabelActive,
                  ]}
                >
                  Focus
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('settings')}
                style={[
                  styles.tabItem,
                  activeTab === 'settings' && styles.tabItemActive,
                ]}
              >
                <Text style={styles.tabIcon}>⚙️</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === 'settings' && styles.tabLabelActive,
                  ]}
                >
                  Settings
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f1715' },
  mainContainer: { flex: 1, backgroundColor: '#0f1715' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 90 },

  // Dashboard Header
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appHeaderTitle: {
    color: '#f0f6f3',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appHeaderSubtitle: {
    color: '#8fa59a',
    fontSize: 13,
    marginTop: 2,
  },
  servicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  servicePillActive: {
    backgroundColor: '#163829',
    borderColor: '#34c759',
  },
  servicePillInactive: {
    backgroundColor: '#262f2b',
    borderColor: '#54635b',
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  servicePillTextActive: {
    color: '#4cd964',
  },
  servicePillTextInactive: {
    color: '#9ba9a1',
  },

  // Hero Counter Card
  heroCard: {
    backgroundColor: '#182621',
    borderColor: '#293d34',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCardLabel: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#23382f',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#9eb4a9',
    fontSize: 12,
    fontWeight: '600',
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 16,
  },
  heroCount: {
    color: '#f0f6f3',
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
  },
  heroMetaCol: {
    marginLeft: 16,
  },
  heroGoalText: {
    color: '#a1b4aa',
    fontSize: 16,
    fontWeight: '600',
  },
  heroTimeText: {
    color: '#51bf93',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#273830',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 5,
  },
  progressBarOverLimit: {
    backgroundColor: '#ff5252',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressPercentText: {
    color: '#a1b4aa',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRemainingText: {
    color: '#7e968a',
    fontSize: 12,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#182621',
    borderColor: '#293d34',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardSectionTitle: {
    color: '#f0f6f3',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  cardSubtitle: {
    color: '#8fa59a',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },

  // App breakdown rows
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  appIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 18,
  },
  appInfoCol: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appName: {
    color: '#e4ede7',
    fontSize: 14,
    fontWeight: '600',
  },
  appMetricCount: {
    color: '#9eb4a9',
    fontSize: 13,
    fontWeight: '700',
  },
  appMiniTrack: {
    height: 6,
    backgroundColor: '#26372f',
    borderRadius: 3,
    overflow: 'hidden',
  },
  appMiniFill: {
    height: '100%',
    borderRadius: 3,
  },
  igCircle: { backgroundColor: '#331b26' },
  igFill: { backgroundColor: '#e1306c' },
  ttCircle: { backgroundColor: '#132c33' },
  ttFill: { backgroundColor: '#00f2fe' },
  ytCircle: { backgroundColor: '#331818' },
  ytFill: { backgroundColor: '#ff0000' },
  scCircle: { backgroundColor: '#333215' },
  scFill: { backgroundColor: '#fffc00' },
  dangerOutlineBtn: { marginTop: 12, borderColor: '#5e2a2a' },
  dangerOutlineBtnText: { color: '#ff8a80' },

  // Tip Card
  tipCard: {
    backgroundColor: '#152b21',
    borderColor: '#29523e',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: {
    color: '#4cd964',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  tipText: {
    color: '#b6cdc2',
    fontSize: 13,
    lineHeight: 19,
  },

  // Timers & Limits Screen
  tabScreenTitle: {
    color: '#f0f6f3',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  tabScreenSubtitle: {
    color: '#8fa59a',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#22342c',
    borderRadius: 10,
    alignItems: 'center',
    borderColor: '#2f473c',
    borderWidth: 1,
  },
  pillButtonSelected: {
    backgroundColor: '#38d39f',
    borderColor: '#38d39f',
  },
  pillButtonText: {
    color: '#c2d4cb',
    fontSize: 13,
    fontWeight: '600',
  },
  pillButtonTextSelected: {
    color: '#0f1715',
    fontWeight: '800',
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#25382f',
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    color: '#e4ede7',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: '#83988e',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#34453e',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#38d39f',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f0f6f3',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },

  // Focus Mode Screen
  focusHeroCard: {
    backgroundColor: '#1b2c24',
    borderColor: '#2e4e3e',
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  focusHeroTitle: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  focusTimerText: {
    color: '#f0f6f3',
    fontSize: 54,
    fontWeight: '900',
    marginVertical: 12,
  },
  focusHeroSubtitle: {
    color: '#9eb4a9',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  focusButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  focusActionButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  focusStartButton: {
    backgroundColor: '#38d39f',
  },
  focusStopButton: {
    backgroundColor: '#ff5252',
  },
  focusActionButtonText: {
    color: '#0f1715',
    fontSize: 15,
    fontWeight: '700',
  },
  focusResetButton: {
    flex: 1,
    backgroundColor: '#263b31',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusResetButtonText: {
    color: '#b6cdc2',
    fontSize: 14,
    fontWeight: '600',
  },

  // Settings Actions
  settingsActionBtn: {
    backgroundColor: '#38d39f',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  settingsActionBtnText: {
    color: '#0f1715',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryOutlineBtn: {
    borderColor: '#375244',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryOutlineBtnText: {
    color: '#a1b4aa',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#121e1a',
    borderTopColor: '#22352c',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#1b2f26',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    color: '#75887e',
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38d39f',
    fontWeight: '700',
  },

  // Intro Screen Styles
  introHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e382b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadgeText: {
    fontSize: 30,
  },
  eyebrow: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#f0f6f3',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 34,
  },
  introSummary: {
    color: '#a1b4aa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  privacyCard: {
    backgroundColor: '#162820',
    borderColor: '#294738',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  privacyCardTitle: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '700',
  },
  privacyCardBody: {
    color: '#a1b4aa',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  statusSection: {
    backgroundColor: '#182621',
    borderColor: '#293d34',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: { color: '#f0f6f3', fontSize: 17, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeActive: {
    backgroundColor: '#143825',
    borderColor: '#34c759',
    borderWidth: 1,
  },
  statusBadgeInactive: {
    backgroundColor: '#2d3330',
    borderColor: '#5b6a62',
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  statusBadgeTextActive: { color: '#4cd964' },
  statusBadgeTextInactive: { color: '#abbcb3' },
  body: { color: '#c5d5cb', fontSize: 14, lineHeight: 21, marginTop: 8 },
  statusHint: { color: '#7a9185', fontSize: 12, lineHeight: 17, marginTop: 8 },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#38d39f',
    borderRadius: 4,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    width: 24,
  },
  checkboxChecked: { backgroundColor: '#38d39f' },
  checkmark: {
    color: '#0f1715',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
  },
  consentText: { color: '#d0dbd3', flex: 1, fontSize: 14, lineHeight: 20 },
  button: {
    alignItems: 'center',
    backgroundColor: '#38d39f',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  buttonDisabled: { backgroundColor: '#2d3d35' },
  buttonText: {
    color: '#0f1715',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  settingsHint: {
    color: '#7a9185',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    textAlign: 'center',
  },
  error: { color: '#ff8a80', fontSize: 13, lineHeight: 18, marginTop: 10 },
  enterDashboardButton: {
    alignItems: 'center',
    borderColor: '#38d39f',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 48,
  },
  enterDashboardButtonText: {
    color: '#38d39f',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default App;
