import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import PrototypeSettings, {
  type DayHistoryItem,
  type PrototypeStatus,
  TARGET_PACKAGES,
} from './src/native/PrototypeSettings';

type Tab = 'counter' | 'timers' | 'block' | 'settings';
type BreathePhase = 'Inhale' | 'Hold' | 'Exhale';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('counter');
  const [consentGiven, setConsentGiven] = useState(false);
  const [settingsError, setSettingsError] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [hasManuallyOpenedIntro, setHasManuallyOpenedIntro] = useState(false);

  // Settings & Limits state
  const [dailyLimit, setDailyLimit] = useState(50);
  const [dailyTimeLimitMin, setDailyTimeLimitMin] = useState(30);
  const [breakReminder, setBreakReminder] = useState(true);
  const [doomscrollAlert, setDoomscrollAlert] = useState(true);
  const [bedtimeShield, setBedtimeShield] = useState(false);

  // Block & Focus state
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [blockInstagram, setBlockInstagram] = useState(true);
  const [blockTikTok, setBlockTikTok] = useState(true);
  const [blockYouTube, setBlockYouTube] = useState(false);
  const [blockSnapchat, setBlockSnapchat] = useState(false);
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(15 * 60);

  // 7-Day History state & interaction
  const [dayHistory, setDayHistory] = useState<DayHistoryItem[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Mindful Breathing Tool state
  const [showBreatheModal, setShowBreatheModal] = useState(false);
  const [breathePhase, setBreathePhase] = useState<BreathePhase>('Inhale');
  const [breatheSecondsRemaining, setBreatheSecondsRemaining] = useState(60);
  const [breatheCycleSec, setBreatheCycleSec] = useState(4);

  const [prototypeStatus, setPrototypeStatus] = useState<PrototypeStatus>({
    serviceConnected: false,
    candidateCount: 0,
    bufferedEventCount: 0,
    instagramCount: 0,
    tiktokCount: 0,
    youtubeCount: 0,
    snapchatCount: 0,
  });

  // Load status and history periodically
  useEffect(() => {
    let mounted = true;
    const refreshStatus = () => {
      PrototypeSettings.getPrototypeStatus()
        .then(status => {
          if (mounted && status) {
            setPrototypeStatus(status);
            if (status.dailyShortLimit) {
              setDailyLimit(status.dailyShortLimit);
            }
            if (status.onboardingCompleted && !hasManuallyOpenedIntro) {
              setShowIntro(false);
            }
          }
        })
        .catch(() => {});

      PrototypeSettings.getDailyHistory()
        .then(history => {
          if (mounted && history && history.length > 0) {
            setDayHistory(history);
          }
        })
        .catch(() => {});
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 1500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [hasManuallyOpenedIntro]);

  // Sync Focus Mode timer and native service
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (focusTimerRunning && focusTimerSeconds > 0) {
      timer = setInterval(() => {
        setFocusTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (focusTimerSeconds === 0 && focusTimerRunning) {
      setFocusTimerRunning(false);
      setFocusModeActive(false);
      PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
      Alert.alert('Focus Session Complete! 🏆', 'Great job avoiding distraction and staying on track.');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [focusTimerRunning, focusTimerSeconds]);

  // Mindful Breath Guide Engine (4-4-4 Box Breathing)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (showBreatheModal && breatheSecondsRemaining > 0) {
      interval = setInterval(() => {
        setBreatheSecondsRemaining(prev => {
          if (prev <= 1) {
            setShowBreatheModal(false);
            Alert.alert('Mindful Reset Complete 🌿', 'Take this calm awareness with you into your day.');
            return 60;
          }
          return prev - 1;
        });

        setBreatheCycleSec(prev => {
          if (prev <= 1) {
            // Transition phase
            setBreathePhase(current => {
              if (current === 'Inhale') return 'Hold';
              if (current === 'Hold') return 'Exhale';
              return 'Inhale';
            });
            return 4; // 4-second cycles
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showBreatheModal, breatheSecondsRemaining]);

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

  const handleEnterDashboard = () => {
    setShowIntro(false);
    PrototypeSettings.setOnboardingCompleted(true).catch(() => {});
  };

  const handleResetCounters = async () => {
    Alert.alert(
      "Reset Today's Counters?",
      'This will reset your scroll count back to 0 for today. Past day history will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to 0',
          style: 'destructive',
          onPress: async () => {
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
              const updatedHistory = await PrototypeSettings.getDailyHistory();
              setDayHistory(updatedHistory);
            } catch {}
          },
        },
      ],
    );
  };

  const handleToggleBlockApp = (app: 'ig' | 'tt' | 'yt' | 'sc') => {
    let nextIg = blockInstagram;
    let nextTt = blockTikTok;
    let nextYt = blockYouTube;
    let nextSc = blockSnapchat;

    if (app === 'ig') {
      nextIg = !blockInstagram;
      setBlockInstagram(nextIg);
    } else if (app === 'tt') {
      nextTt = !blockTikTok;
      setBlockTikTok(nextTt);
    } else if (app === 'yt') {
      nextYt = !blockYouTube;
      setBlockYouTube(nextYt);
    } else if (app === 'sc') {
      nextSc = !blockSnapchat;
      setBlockSnapchat(nextSc);
    }

    if (focusModeActive || focusTimerRunning) {
      const blocked: string[] = [];
      if (nextIg) blocked.push(TARGET_PACKAGES.INSTAGRAM);
      if (nextTt) blocked.push(TARGET_PACKAGES.TIKTOK);
      if (nextYt) blocked.push(TARGET_PACKAGES.YOUTUBE);
      if (nextSc) blocked.push(TARGET_PACKAGES.SNAPCHAT);
      const mins = Math.max(1, Math.ceil(focusTimerSeconds / 60));
      PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
    }
  };

  const handleToggleAllApps = (blockAll: boolean) => {
    setBlockInstagram(blockAll);
    setBlockTikTok(blockAll);
    setBlockYouTube(blockAll);
    setBlockSnapchat(blockAll);

    if (focusModeActive || focusTimerRunning) {
      const blocked: string[] = blockAll
        ? [
            TARGET_PACKAGES.INSTAGRAM,
            TARGET_PACKAGES.TIKTOK,
            TARGET_PACKAGES.YOUTUBE,
            TARGET_PACKAGES.SNAPCHAT,
          ]
        : [];
      const mins = Math.max(1, Math.ceil(focusTimerSeconds / 60));
      PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
    }
  };

  const getBlockedPackagesList = (): string[] => {
    const list: string[] = [];
    if (blockInstagram) list.push(TARGET_PACKAGES.INSTAGRAM);
    if (blockTikTok) list.push(TARGET_PACKAGES.TIKTOK);
    if (blockYouTube) list.push(TARGET_PACKAGES.YOUTUBE);
    if (blockSnapchat) list.push(TARGET_PACKAGES.SNAPCHAT);
    return list;
  };

  const handleToggleFocusSession = async () => {
    if (focusTimerRunning) {
      setFocusTimerRunning(false);
      setFocusModeActive(false);
      await PrototypeSettings.setFocusMode(false, 0, []);
    } else {
      const blocked = getBlockedPackagesList();
      const minutes = Math.max(1, Math.ceil(focusTimerSeconds / 60));
      await PrototypeSettings.setFocusMode(true, minutes, blocked);
      setFocusModeActive(true);
      setFocusTimerRunning(true);
    }
  };

  const handleQuickFocus15m = async () => {
    setFocusTimerSeconds(15 * 60);
    const blocked = getBlockedPackagesList();
    await PrototypeSettings.setFocusMode(true, 15, blocked);
    setFocusModeActive(true);
    setFocusTimerRunning(true);
    setActiveTab('block');
  };

  const handleAdjustLimit = (delta: number) => {
    const next = Math.max(10, Math.min(300, dailyLimit + delta));
    setDailyLimit(next);
    PrototypeSettings.setDailyLimits(next, dailyTimeLimitMin).catch(() => {});
  };

  const handleAdjustTimeLimit = (delta: number) => {
    const next = Math.max(5, Math.min(180, dailyTimeLimitMin + delta));
    setDailyTimeLimitMin(next);
    PrototypeSettings.setDailyLimits(dailyLimit, next).catch(() => {});
  };

  const handleAdjustFocusTimer = (deltaMinutes: number) => {
    if (focusTimerRunning) return;
    const currentMins = Math.round(focusTimerSeconds / 60);
    const nextMins = Math.max(5, Math.min(120, currentMins + deltaMinutes));
    setFocusTimerSeconds(nextMins * 60);
  };

  const handleSelectDailyLimit = (limit: number) => {
    setDailyLimit(limit);
    PrototypeSettings.setDailyLimits(limit, dailyTimeLimitMin).catch(() => {});
  };

  const handleSelectDailyTimeLimit = (mins: number) => {
    setDailyTimeLimitMin(mins);
    PrototypeSettings.setDailyLimits(dailyLimit, mins).catch(() => {});
  };

  const handleSelectFocusPreset = (mins: number) => {
    setFocusTimerSeconds(mins * 60);
    if (focusTimerRunning) {
      const blocked = getBlockedPackagesList();
      PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
    }
  };

  const totalShorts = prototypeStatus.candidateCount;
  const estMinutes = Math.round(totalShorts * 0.5); // avg 30s per short
  const progressRatio = Math.min(totalShorts / (dailyLimit || 1), 1);
  const progressPercent = Math.round(progressRatio * 100);

  // Health pace categorization
  const isOverLimit = totalShorts >= dailyLimit;
  const isNearLimit = !isOverLimit && progressPercent >= 75;

  // App breakdown
  const igCount = prototypeStatus.instagramCount ?? 0;
  const ttCount = prototypeStatus.tiktokCount ?? 0;
  const ytCount = prototypeStatus.youtubeCount ?? 0;
  const scCount = prototypeStatus.snapchatCount ?? 0;

  // 7-Day Stats
  const weeklyTotal = dayHistory.reduce((acc, cur) => acc + cur.count, 0);
  const dailyAverage = dayHistory.length > 0 ? Math.round(weeklyTotal / dayHistory.length) : totalShorts;

  // Greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '☀️', tip: 'Fresh start — keep your morning scroll-free.' };
    if (hour < 17) return { text: 'Good afternoon', icon: '⚡', tip: 'Notice if boredom triggers unconscious swipes.' };
    if (hour < 22) return { text: 'Good evening', icon: '🌇', tip: 'Wind down your dopamine levels for sound sleep.' };
    return { text: 'Late night hours', icon: '🌙', tip: 'Protect your melatonin and deep recovery rest.' };
  };

  const greeting = getGreeting();

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
          Quietly observe your short-form video consumption across Instagram Reels, TikTok, YouTube Shorts, and Snapchat so you notice doomscrolling before it takes over your day.
        </Text>
      </View>

      {/* Feature Highlights Card */}
      <View style={styles.onboardingHighlights}>
        <View style={styles.highlightItem}>
          <Text style={styles.highlightIcon}>📊</Text>
          <View style={styles.highlightInfo}>
            <Text style={styles.highlightTitle}>Live Swipe Counter</Text>
            <Text style={styles.highlightDesc}>Floating draggable HUD pulses on every short you swipe.</Text>
          </View>
        </View>
        <View style={styles.highlightItem}>
          <Text style={styles.highlightIcon}>🛡️</Text>
          <View style={styles.highlightInfo}>
            <Text style={styles.highlightTitle}>Distraction Focus Blocker</Text>
            <Text style={styles.highlightDesc}>Locks addictive feeds during study, work, or bedtime.</Text>
          </View>
        </View>
        <View style={styles.highlightItem}>
          <Text style={styles.highlightIcon}>🔒</Text>
          <View style={styles.highlightInfo}>
            <Text style={styles.highlightTitle}>100% On-Device & Private</Text>
            <Text style={styles.highlightDesc}>Never reads messages, passwords, or personal screen data.</Text>
          </View>
        </View>
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
          Service tracks scroll events live in the background. Use the dashboard to monitor limits and focus blocks.
        </Text>
      </View>

      {prototypeStatus.serviceConnected ? (
        <View style={styles.connectedCard}>
          <View style={styles.connectedHeaderRow}>
            <Text style={styles.connectedCheckBadge}>✓</Text>
            <View style={styles.connectedHeaderTextWrap}>
              <Text style={styles.connectedHeaderTitle}>Accessibility Connected!</Text>
              <Text style={styles.connectedHeaderSubtitle}>
                ReelCount is live & ready to track mindful habits
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleEnterDashboard}
            style={styles.primaryLaunchButton}
          >
            <Text style={styles.primaryLaunchButtonText}>
              Go to Home Dashboard →
            </Text>
          </Pressable>
        </View>
      ) : null}

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
          I understand this prototype and choose to continue to Android accessibility settings.
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
        The service remains off until you enable it in Android settings. You can turn it off there at any time.
      </Text>

      {settingsError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          Android accessibility settings could not be opened. Please try again.
        </Text>
      ) : null}

      <Pressable
        onPress={handleEnterDashboard}
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
      {/* Top App Header with Adaptive Greeting */}
      <View style={styles.dashboardHeader}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandBadgeEmoji}>🎬</Text>
            <Text style={styles.appHeaderTitle}>ReelCount</Text>
          </View>
          <Text style={styles.greetingText}>
            {greeting.icon} {greeting.text} · <Text style={styles.greetingTip}>{greeting.tip}</Text>
          </Text>
        </View>
        <View
          style={[
            styles.servicePill,
            prototypeStatus.serviceConnected
              ? styles.servicePillActive
              : styles.servicePillInactive,
          ]}
        >
          <View
            style={[
              styles.serviceDot,
              prototypeStatus.serviceConnected ? styles.serviceDotActive : styles.serviceDotInactive,
            ]}
          />
          <Text
            style={[
              styles.servicePillText,
              prototypeStatus.serviceConnected
                ? styles.servicePillTextActive
                : styles.servicePillTextInactive,
            ]}
          >
            {prototypeStatus.serviceConnected ? 'Live Active' : 'Off'}
          </Text>
        </View>
      </View>

      {/* Focus Mode Live Banner if running */}
      {focusTimerRunning && (
        <Pressable onPress={() => setActiveTab('block')} style={styles.activeFocusBanner}>
          <Text style={styles.activeFocusBannerIcon}>🛡️</Text>
          <View style={styles.activeFocusBannerCol}>
            <Text style={styles.activeFocusBannerTitle}>Shield Mode Engaged</Text>
            <Text style={styles.activeFocusBannerSubtitle}>
              {formatTimer(focusTimerSeconds)} remaining · Distraction feeds locked
            </Text>
          </View>
          <Text style={styles.activeFocusBannerAction}>View →</Text>
        </Pressable>
      )}

      {/* Hero Counter Card */}
      <View style={[styles.heroCard, isOverLimit && styles.heroCardOverLimit]}>
        <View style={styles.heroTopRow}>
          <View
            style={[
              styles.habitPill,
              isOverLimit
                ? styles.habitPillDanger
                : isNearLimit
                ? styles.habitPillWarning
                : styles.habitPillSafe,
            ]}
          >
            <Text
              style={[
                styles.habitPillText,
                isOverLimit
                  ? styles.habitPillTextDanger
                  : isNearLimit
                  ? styles.habitPillTextWarning
                  : styles.habitPillTextSafe,
              ]}
            >
              {isOverLimit ? '🚨 LIMIT BREACHED' : isNearLimit ? '⚡ APPROACHING LIMIT' : '🌱 MINDFUL PACE'}
            </Text>
          </View>

          <View style={styles.heroTopActions}>
            <Pressable
              onPress={() => setShowBreatheModal(true)}
              style={styles.zenPauseButton}
            >
              <Text style={styles.zenPauseButtonText}>🧘 1m Reset</Text>
            </Pressable>
            <Pressable onPress={handleResetCounters} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        {/* Circular / Concentric Visual Ring Center */}
        <View style={styles.circularMetricContainer}>
          <View style={styles.circularRingHalo}>
            <View style={styles.circularRingInner}>
              <Text style={[styles.heroCount, isOverLimit && styles.heroCountOverLimit]}>
                {totalShorts}
              </Text>
              <Text style={styles.heroUnitLabel}>videos today</Text>
              <Text style={styles.heroGoalSubtext}>of {dailyLimit} target</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Dopamine Risk Gauge */}
        <View style={styles.riskGaugeContainer}>
          <View style={styles.riskGaugeHeader}>
            <Text style={styles.riskGaugeLabel}>DOPAMINE ATTRACTION</Text>
            <Text
              style={[
                styles.riskGaugeStatusText,
                isOverLimit
                  ? styles.textDanger
                  : isNearLimit
                  ? styles.textWarning
                  : styles.textSafe,
              ]}
            >
              {isOverLimit
                ? 'High Risk (Take a Walk)'
                : isNearLimit
                ? 'Elevated Friction'
                : 'Balanced & Mindful'}
            </Text>
          </View>
          <View style={styles.riskTrack}>
            <View
              style={[
                styles.riskFill,
                { width: `${Math.max(4, Math.min(100, progressPercent))}%` },
                isOverLimit
                  ? styles.progressBarDanger
                  : isNearLimit
                  ? styles.progressBarWarning
                  : styles.progressBarNormal,
              ]}
            />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressPercentText}>{progressPercent}% consumed</Text>
            <Text style={styles.progressRemainingText}>
              {isOverLimit
                ? `${totalShorts - dailyLimit} over target`
                : `${dailyLimit - totalShorts} remaining`}
            </Text>
          </View>
        </View>

        {/* 4-Stat Quick Grid inside Hero Card */}
        <View style={styles.heroStatsGrid}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatIcon}>⏱️</Text>
            <Text style={styles.heroStatValue}>~{estMinutes}m</Text>
            <Text style={styles.heroStatLabel}>Screen Time</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatIcon}>🎯</Text>
            <Text style={styles.heroStatValue}>{dailyLimit}</Text>
            <Text style={styles.heroStatLabel}>Daily Cap</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatIcon}>🔥</Text>
            <Text style={styles.heroStatValue}>3 Days</Text>
            <Text style={styles.heroStatLabel}>Mindful Streak</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatIcon}>📈</Text>
            <Text style={styles.heroStatValue}>{dailyAverage}</Text>
            <Text style={styles.heroStatLabel}>7d Average</Text>
          </View>
        </View>

        {/* Quick Action Button */}
        {!focusTimerRunning && (
          <Pressable onPress={handleQuickFocus15m} style={styles.quickFocusActionBtn}>
            <Text style={styles.quickFocusActionText}>⚡ Start Quick 15m Focus Shield</Text>
          </Pressable>
        )}
      </View>

      {/* 7-Day Activity History Bar Chart */}
      <View style={styles.sectionCard}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.cardSectionTitle}>Weekly Rhythm</Text>
            <Text style={styles.chartSubtitle}>
              Tap any column to inspect daily habits
            </Text>
          </View>
          <View style={styles.chartAvgBadge}>
            <Text style={styles.chartAvgBadgeText}>Avg: {dailyAverage}/day</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {dayHistory.length > 0
            ? dayHistory.map((item, idx) => {
                const maxCount = Math.max(1, ...dayHistory.map(d => d.count), dailyLimit);
                const heightRatio = Math.min(item.count / maxCount, 1);
                const isToday = item.label === 'Today' || idx === dayHistory.length - 1;
                const exceeded = item.count >= dailyLimit;
                const isSelected = selectedHistoryIndex === idx;

                return (
                  <Pressable
                    key={item.date || idx}
                    onPress={() => setSelectedHistoryIndex(idx === selectedHistoryIndex ? null : idx)}
                    style={styles.barCol}
                  >
                    <Text style={[styles.barCountText, isSelected && styles.barCountTextSelected]}>
                      {item.count > 0 ? item.count : '-'}
                    </Text>
                    <View style={[styles.barTrack, isSelected && styles.barTrackSelected]}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.max(8, Math.round(heightRatio * 100))}%` },
                          isToday && styles.barFillToday,
                          exceeded && styles.barFillLimit,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isToday && styles.barLabelToday, isSelected && styles.barLabelSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })
            : ['M', 'T', 'W', 'T', 'F', 'S', 'Today'].map((label, idx) => (
                <View key={idx} style={styles.barCol}>
                  <Text style={styles.barCountText}>-</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, styles.barPlaceholderFill]} />
                  </View>
                  <Text style={[styles.barLabel, idx === 6 && styles.barLabelToday]}>{label}</Text>
                </View>
              ))}
        </View>

        {/* Selected Day Insight Card */}
        {selectedHistoryIndex !== null && dayHistory[selectedHistoryIndex] && (
          <View style={styles.dayInsightCard}>
            <Text style={styles.dayInsightTitle}>
              📅 {dayHistory[selectedHistoryIndex].label} ({dayHistory[selectedHistoryIndex].date})
            </Text>
            <Text style={styles.dayInsightBody}>
              Scrolled <Text style={styles.highlightText}>{dayHistory[selectedHistoryIndex].count} shorts</Text> (≈ {Math.round(dayHistory[selectedHistoryIndex].count * 0.5)} mins).{' '}
              {dayHistory[selectedHistoryIndex].count <= dailyLimit
                ? '🎯 Kept inside your healthy target!'
                : `⚠️ Exceeded target by ${dayHistory[selectedHistoryIndex].count - dailyLimit} videos.`}
            </Text>
          </View>
        )}
      </View>

      {/* App-by-App Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Platform Breakdown</Text>
          <Text style={styles.cardSelectedHighlight}>{totalShorts} Total</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Distribution of scrolls across monitored video feeds today.
        </Text>

        {/* Instagram */}
        <View style={styles.platformCard}>
          <View style={[styles.platformIconCircle, styles.igCircle]}>
            <Text style={styles.platformIconEmoji}>📸</Text>
          </View>
          <View style={styles.platformDetailsCol}>
            <View style={styles.platformTitleRow}>
              <Text style={styles.platformName}>Instagram Reels</Text>
              <Text style={styles.platformCountText}>{igCount} reels</Text>
            </View>
            <View style={styles.platformTrack}>
              <View
                style={[
                  styles.platformFill,
                  styles.igFill,
                  { width: `${totalShorts > 0 ? (igCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
            <View style={styles.platformMetaRow}>
              <Text style={styles.platformTimeEstimate}>~{Math.round(igCount * 0.5)} mins spent</Text>
              <Text style={styles.platformShareText}>
                {totalShorts > 0 ? Math.round((igCount / totalShorts) * 100) : 0}% of scrolls
              </Text>
            </View>
          </View>
        </View>

        {/* TikTok */}
        <View style={styles.platformCard}>
          <View style={[styles.platformIconCircle, styles.ttCircle]}>
            <Text style={styles.platformIconEmoji}>🎵</Text>
          </View>
          <View style={styles.platformDetailsCol}>
            <View style={styles.platformTitleRow}>
              <Text style={styles.platformName}>TikTok</Text>
              <Text style={styles.platformCountText}>{ttCount} videos</Text>
            </View>
            <View style={styles.platformTrack}>
              <View
                style={[
                  styles.platformFill,
                  styles.ttFill,
                  { width: `${totalShorts > 0 ? (ttCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
            <View style={styles.platformMetaRow}>
              <Text style={styles.platformTimeEstimate}>~{Math.round(ttCount * 0.5)} mins spent</Text>
              <Text style={styles.platformShareText}>
                {totalShorts > 0 ? Math.round((ttCount / totalShorts) * 100) : 0}% of scrolls
              </Text>
            </View>
          </View>
        </View>

        {/* YouTube */}
        <View style={styles.platformCard}>
          <View style={[styles.platformIconCircle, styles.ytCircle]}>
            <Text style={styles.platformIconEmoji}>▶️</Text>
          </View>
          <View style={styles.platformDetailsCol}>
            <View style={styles.platformTitleRow}>
              <Text style={styles.platformName}>YouTube Shorts</Text>
              <Text style={styles.platformCountText}>{ytCount} shorts</Text>
            </View>
            <View style={styles.platformTrack}>
              <View
                style={[
                  styles.platformFill,
                  styles.ytFill,
                  { width: `${totalShorts > 0 ? (ytCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
            <View style={styles.platformMetaRow}>
              <Text style={styles.platformTimeEstimate}>~{Math.round(ytCount * 0.5)} mins spent</Text>
              <Text style={styles.platformShareText}>
                {totalShorts > 0 ? Math.round((ytCount / totalShorts) * 100) : 0}% of scrolls
              </Text>
            </View>
          </View>
        </View>

        {/* Snapchat */}
        <View style={styles.platformCard}>
          <View style={[styles.platformIconCircle, styles.scCircle]}>
            <Text style={styles.platformIconEmoji}>👻</Text>
          </View>
          <View style={styles.platformDetailsCol}>
            <View style={styles.platformTitleRow}>
              <Text style={styles.platformName}>Snapchat Spotlight</Text>
              <Text style={styles.platformCountText}>{scCount} clips</Text>
            </View>
            <View style={styles.platformTrack}>
              <View
                style={[
                  styles.platformFill,
                  styles.scFill,
                  { width: `${totalShorts > 0 ? (scCount / totalShorts) * 100 : 0}%` },
                ]}
              />
            </View>
            <View style={styles.platformMetaRow}>
              <Text style={styles.platformTimeEstimate}>~{Math.round(scCount * 0.5)} mins spent</Text>
              <Text style={styles.platformShareText}>
                {totalShorts > 0 ? Math.round((scCount / totalShorts) * 100) : 0}% of scrolls
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Floating HUD info */}
      <View style={styles.tipCard}>
        <View style={styles.tipHeaderRow}>
          <Text style={styles.tipTitleIcon}>💡</Text>
          <Text style={styles.tipTitle}>Live On-Screen Overlay HUD</Text>
        </View>
        <Text style={styles.tipText}>
          When you open Instagram, TikTok, or YouTube, a draggable floating pill appears showing your reel count in real time and vibrates gently on every swipe.
        </Text>
      </View>
    </ScrollView>
  );

  // Render Timers & Limits Tab
  const renderTimersTab = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.tabScreenTitle}>App Timers & Limits</Text>
      <Text style={styles.tabScreenSubtitle}>
        Set deliberate habit boundaries to keep your digital consumption healthy.
      </Text>

      {/* Daily Scroll Limit */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Daily Shorts Target</Text>
          <Text style={styles.cardSelectedHighlight}>{dailyLimit} Reels / Day</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Choose how many short videos you consider a reasonable daily maximum.
        </Text>

        <View style={styles.pillRow}>
          {[25, 50, 75, 100, 150].map(limit => (
            <Pressable
              key={limit}
              onPress={() => handleSelectDailyLimit(limit)}
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
                {limit}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stepper for custom values */}
        <View style={styles.stepperRow}>
          <Pressable onPress={() => handleAdjustLimit(-5)} style={styles.stepperBtn}>
            <Text style={styles.stepperBtnText}>- 5</Text>
          </Pressable>
          <Text style={styles.stepperLabel}>Fine-tune: {dailyLimit} reels</Text>
          <Pressable onPress={() => handleAdjustLimit(5)} style={styles.stepperBtn}>
            <Text style={styles.stepperBtnText}>+ 5</Text>
          </Pressable>
        </View>
      </View>

      {/* Daily Time Limit */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Daily Time Cap</Text>
          <Text style={styles.cardSelectedHighlight}>{dailyTimeLimitMin} Minutes</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Target cap for cumulative screen time across short video feeds.
        </Text>

        <View style={styles.pillRow}>
          {[15, 30, 45, 60, 90].map(mins => (
            <Pressable
              key={mins}
              onPress={() => handleSelectDailyTimeLimit(mins)}
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
                {mins}m
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stepper for custom minutes */}
        <View style={styles.stepperRow}>
          <Pressable onPress={() => handleAdjustTimeLimit(-5)} style={styles.stepperBtn}>
            <Text style={styles.stepperBtnText}>- 5m</Text>
          </Pressable>
          <Text style={styles.stepperLabel}>Fine-tune: {dailyTimeLimitMin} mins</Text>
          <Pressable onPress={() => handleAdjustTimeLimit(5)} style={styles.stepperBtn}>
            <Text style={styles.stepperBtnText}>+ 5m</Text>
          </Pressable>
        </View>
      </View>

      {/* Bedtime Wind-Down Shield */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>🌙 Bedtime Sleep Shield</Text>
          <View style={[styles.statusBadgeSmall, bedtimeShield ? styles.badgeBlocked : styles.badgeNormal]}>
            <Text style={[styles.statusBadgeSmallText, bedtimeShield ? styles.textBlocked : styles.textNormal]}>
              {bedtimeShield ? 'SCHEDULED (11 PM)' : 'OFF'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            const next = !bedtimeShield;
            setBedtimeShield(next);
            Alert.alert(
              next ? 'Bedtime Shield Active 🌙' : 'Bedtime Shield Disabled',
              next
                ? 'Distracting feeds will be strictly blocked between 11:00 PM and 7:00 AM.'
                : 'Nighttime automatic lock has been turned off.',
            );
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Auto-Lock Between 11 PM - 7 AM</Text>
            <Text style={styles.toggleSubtitle}>
              Protects nighttime rest and eliminates late-night doomscrolling before sleep.
            </Text>
          </View>
          <View style={[styles.switchTrack, bedtimeShield && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, bedtimeShield && styles.switchThumbOn]} />
          </View>
        </Pressable>
      </View>

      {/* Smart Alerts */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Smart Scrolling Alerts</Text>

        <Pressable
          onPress={() => setBreakReminder(prev => !prev)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Daily Target Push Notification</Text>
            <Text style={styles.toggleSubtitle}>
              Sends an alert when your count hits {dailyLimit} shorts.
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
            <Text style={styles.toggleTitle}>Haptic Swipe Tick</Text>
            <Text style={styles.toggleSubtitle}>
              Gentle tactile vibration pulse on each detected video scroll.
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
      <Text style={styles.tabScreenTitle}>Block & Focus Shield</Text>
      <Text style={styles.tabScreenSubtitle}>
        Instantly lock distracting video feeds when you need deep focus or rest.
      </Text>

      {/* Focus Session Card */}
      <View style={[styles.focusHeroCard, focusTimerRunning && styles.focusHeroCardActive]}>
        <View style={styles.focusHeaderRow}>
          <Text style={styles.focusHeroTitle}>DEEP WORK FOCUS SHIELD</Text>
          <View style={[styles.focusLiveBadge, focusTimerRunning ? styles.focusLiveBadgeActive : styles.focusLiveBadgeIdle]}>
            <Text style={[styles.focusLiveBadgeText, focusTimerRunning ? styles.focusLiveBadgeTextActive : styles.focusLiveBadgeTextIdle]}>
              {focusTimerRunning ? '● SHIELD ACTIVE' : '○ IDLE'}
            </Text>
          </View>
        </View>

        <Text style={styles.focusTimerText}>{formatTimer(focusTimerSeconds)}</Text>
        <Text style={styles.focusHeroSubtitle}>
          {focusTimerRunning
            ? 'Distracting video feeds are actively locked. Opening them will instantly kick back to Home.'
            : 'Select session duration and start to block selected feeds.'}
        </Text>

        {/* Preset Duration Buttons */}
        {!focusTimerRunning && (
          <View style={styles.presetRow}>
            {[15, 25, 45, 60].map(mins => (
              <Pressable
                key={mins}
                onPress={() => handleSelectFocusPreset(mins)}
                style={[
                  styles.presetBtn,
                  focusTimerSeconds === mins * 60 && styles.presetBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    focusTimerSeconds === mins * 60 && styles.presetBtnTextActive,
                  ]}
                >
                  {mins === 25 ? '🍅 25m' : `${mins}m`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Stepper to customize timer while paused */}
        {!focusTimerRunning && (
          <View style={styles.stepperRow}>
            <Pressable onPress={() => handleAdjustFocusTimer(-5)} style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>- 5m</Text>
            </Pressable>
            <Text style={styles.stepperLabel}>Duration: {Math.round(focusTimerSeconds / 60)} min</Text>
            <Pressable onPress={() => handleAdjustFocusTimer(5)} style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>+ 5m</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.focusButtonsRow}>
          <Pressable
            onPress={handleToggleFocusSession}
            style={[
              styles.focusActionButton,
              focusTimerRunning ? styles.focusStopButton : styles.focusStartButton,
            ]}
          >
            <Text style={styles.focusActionButtonText}>
              {focusTimerRunning ? 'Stop Focus Shield' : 'Start Focus Shield'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setFocusTimerRunning(false);
              setFocusModeActive(false);
              setFocusTimerSeconds(15 * 60);
              PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
            }}
            style={styles.focusResetButton}
          >
            <Text style={styles.focusResetButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* Per-App Distraction Locks */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Distraction Blocking Rules</Text>
          <View style={styles.quickSelectRow}>
            <Pressable onPress={() => handleToggleAllApps(true)} style={styles.quickSelectBtn}>
              <Text style={styles.quickSelectBtnText}>Lock All</Text>
            </Pressable>
            <Pressable onPress={() => handleToggleAllApps(false)} style={styles.quickSelectBtn}>
              <Text style={styles.quickSelectBtnText}>Unlock</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Select which video apps are immediately blocked during active focus sessions.
        </Text>

        {/* Master Focus Mode switch */}
        <Pressable
          onPress={() => {
            const next = !focusModeActive;
            setFocusModeActive(next);
            if (next) {
              const blocked = getBlockedPackagesList();
              const mins = Math.max(1, Math.ceil(focusTimerSeconds / 60));
              PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
              setFocusTimerRunning(true);
            } else {
              setFocusTimerRunning(false);
              PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
            }
          }}
          style={styles.masterToggleRow}
        >
          <View style={styles.toggleInfo}>
            <View style={styles.masterTitleRow}>
              <Text style={styles.masterToggleIcon}>🛡️</Text>
              <Text style={styles.masterToggleTitle}>Master Focus Mode</Text>
            </View>
            <Text style={styles.toggleSubtitle}>
              {focusModeActive
                ? 'Active · Selected distraction feeds are blocked'
                : 'Disabled · Tap switch to turn on instant protection'}
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
          onPress={() => handleToggleBlockApp('ig')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <Text style={styles.toggleTitle}>📸 Instagram Reels</Text>
            <View style={[styles.statusBadgeSmall, blockInstagram && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockInstagram && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockInstagram ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockInstagram && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockInstagram && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('tt')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <Text style={styles.toggleTitle}>🎵 TikTok Feed</Text>
            <View style={[styles.statusBadgeSmall, blockTikTok && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockTikTok && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockTikTok ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockTikTok && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockTikTok && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('yt')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <Text style={styles.toggleTitle}>▶️ YouTube Shorts</Text>
            <View style={[styles.statusBadgeSmall, blockYouTube && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockYouTube && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockYouTube ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockYouTube && styles.switchTrackOn]}
          >
            <View
              style={[styles.switchThumb, blockYouTube && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('sc')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <Text style={styles.toggleTitle}>👻 Snapchat Spotlight</Text>
            <View style={[styles.statusBadgeSmall, blockSnapchat && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockSnapchat && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockSnapchat ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
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
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Android System Health</Text>
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
              {prototypeStatus.serviceConnected ? 'Active' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Permissions Checklist */}
        <View style={styles.healthList}>
          <View style={styles.healthItem}>
            <Text style={styles.healthIcon}>{prototypeStatus.serviceConnected ? '✅' : '⚠️'}</Text>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Accessibility Tracking Service</Text>
              <Text style={styles.healthDesc}>
                {prototypeStatus.serviceConnected
                  ? 'Connected and listening for short video scrolls.'
                  : 'Requires enablement in Android Accessibility Settings.'}
              </Text>
            </View>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthIcon}>✅</Text>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Floating Screen Overlay (HUD)</Text>
              <Text style={styles.healthDesc}>TYPE_ACCESSIBILITY_OVERLAY enabled for draggable pill.</Text>
            </View>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthIcon}>✅</Text>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Local Device Storage</Text>
              <Text style={styles.healthDesc}>Volatile SharedPreferences storage active (offline).</Text>
            </View>
          </View>
        </View>

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
        <View style={styles.privacyHeaderRow}>
          <Text style={styles.privacyShieldIcon}>🛡️</Text>
          <Text style={styles.cardSectionTitle}>On-Device Privacy Commitment</Text>
        </View>
        <Text style={styles.body}>
          • Only event type, app package, and event timestamps are observed.
        </Text>
        <Text style={styles.body}>
          • Zero screen text, UI tree content, messages, or screenshots are ever read.
        </Text>
        <Text style={styles.body}>
          • No internet analytics, advertising IDs, or external servers are used.
        </Text>
      </View>

      {/* Management Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>Maintenance & Onboarding</Text>
        <Pressable
          onPress={() => {
            setHasManuallyOpenedIntro(true);
            setShowIntro(true);
          }}
          style={styles.secondaryOutlineBtn}
        >
          <Text style={styles.secondaryOutlineBtnText}>
            View Intro & Permissions Guide
          </Text>
        </Pressable>

        <Pressable
          onPress={handleResetCounters}
          style={[styles.secondaryOutlineBtn, styles.dangerOutlineBtn]}
        >
          <Text style={[styles.secondaryOutlineBtnText, styles.dangerOutlineBtnText]}>
            Reset Today's Counters to 0
          </Text>
        </Pressable>
      </View>

      {/* App Version Footer */}
      <View style={styles.footerCol}>
        <Text style={styles.footerVersion}>ReelCount v0.2.4</Text>
        <Text style={styles.footerTagline}>Mindful Digital Wellbeing Sanctuary</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#090e0c" />

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

        {/* Mindful Breathing Modal (4-4-4 Box Breathing) */}
        <Modal
          visible={showBreatheModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBreatheModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.breatheModalCard}>
              <Text style={styles.breatheModalEyebrow}>MINDFUL RECOVERY PAUSE</Text>
              <Text style={styles.breatheModalTitle}>4-4-4 Box Breathing</Text>
              <Text style={styles.breatheModalDesc}>
                Take a moment to disconnect dopamine reflex and restore mental presence.
              </Text>

              {/* Expanding / Pulsing Zen Breathing Ring */}
              <View style={styles.breatheVisualWrap}>
                <View
                  style={[
                    styles.breatheRingOuter,
                    breathePhase === 'Inhale'
                      ? styles.breatheRingInhale
                      : breathePhase === 'Hold'
                      ? styles.breatheRingHold
                      : styles.breatheRingExhale,
                  ]}
                >
                  <View style={styles.breatheRingInner}>
                    <Text style={styles.breathePhaseText}>{breathePhase}</Text>
                    <Text style={styles.breatheCycleCount}>{breatheCycleSec}s</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.breatheRemainingText}>
                {breatheSecondsRemaining}s total remaining
              </Text>

              <Pressable
                onPress={() => {
                  setShowBreatheModal(false);
                  setBreatheSecondsRemaining(60);
                  setBreathePhase('Inhale');
                }}
                style={styles.breatheCloseBtn}
              >
                <Text style={styles.breatheCloseBtnText}>End Mindful Pause</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090e0c' },
  mainContainer: { flex: 1, backgroundColor: '#090e0c' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 95 },

  // Dashboard Header
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadgeEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  appHeaderTitle: {
    color: '#f1f5f3',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  greetingText: {
    color: '#a3b8ac',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  greetingTip: {
    color: '#6e8579',
    fontWeight: '400',
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  servicePillActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  servicePillInactive: {
    backgroundColor: '#1b2420',
    borderColor: '#374740',
  },
  serviceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  serviceDotActive: {
    backgroundColor: '#34c759',
  },
  serviceDotInactive: {
    backgroundColor: '#7a8e84',
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  servicePillTextActive: {
    color: '#4cd964',
  },
  servicePillTextInactive: {
    color: '#8aa395',
  },

  // Focus Banner
  activeFocusBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFocusBannerIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  activeFocusBannerCol: {
    flex: 1,
  },
  activeFocusBannerTitle: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '700',
  },
  activeFocusBannerSubtitle: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
  activeFocusBannerAction: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },

  // Hero Counter Card
  heroCard: {
    backgroundColor: '#111d17',
    borderColor: 'rgba(56, 211, 159, 0.2)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCardOverLimit: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: '#1a1414',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zenPauseButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    marginRight: 8,
  },
  zenPauseButtonText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '700',
  },
  habitPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  habitPillSafe: {
    backgroundColor: 'rgba(56, 211, 159, 0.1)',
    borderColor: 'rgba(56, 211, 159, 0.3)',
  },
  habitPillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  habitPillDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  habitPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  habitPillTextSafe: { color: '#38d39f' },
  habitPillTextWarning: { color: '#fbbf24' },
  habitPillTextDanger: { color: '#f87171' },

  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1a2b22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#294335',
  },
  resetButtonText: {
    color: '#9cb1a6',
    fontSize: 12,
    fontWeight: '600',
  },

  // Circular / Concentric Ring Visual Center
  circularMetricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  circularRingHalo: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
    borderColor: 'rgba(56, 211, 159, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 211, 159, 0.04)',
  },
  circularRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCount: {
    color: '#f1f5f3',
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 58,
  },
  heroCountOverLimit: {
    color: '#f87171',
  },
  heroUnitLabel: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  heroGoalSubtext: {
    color: '#6e8579',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },

  // Dopamine Risk Gauge
  riskGaugeContainer: {
    marginTop: 8,
  },
  riskGaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  riskGaugeLabel: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  riskGaugeStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSafe: { color: '#38d39f' },
  textWarning: { color: '#fbbf24' },
  textDanger: { color: '#f87171' },

  riskTrack: {
    height: 9,
    backgroundColor: '#1b2d24',
    borderRadius: 5,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressBarNormal: {
    backgroundColor: '#38d39f',
  },
  progressBarWarning: {
    backgroundColor: '#fbbf24',
  },
  progressBarDanger: {
    backgroundColor: '#ef4444',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressPercentText: {
    color: '#a3b8ac',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRemainingText: {
    color: '#7a9184',
    fontSize: 12,
    fontWeight: '500',
  },

  // 4-Stat Quick Grid inside Hero Card
  heroStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162720',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.1)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatIcon: {
    fontSize: 15,
    marginBottom: 2,
  },
  heroStatValue: {
    color: '#f1f5f3',
    fontSize: 14,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#6e8579',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  heroStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#233a2e',
  },

  quickFocusActionBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
    borderColor: 'rgba(56, 211, 159, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFocusActionText: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '700',
  },

  // 7-Day History Chart
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chartSubtitle: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
  },
  chartAvgBadge: {
    backgroundColor: '#1b2d24',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2b4437',
  },
  chartAvgBadgeText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 125,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barCountText: {
    color: '#6e8579',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    minHeight: 14,
  },
  barCountTextSelected: {
    color: '#22d3ee',
    fontWeight: '900',
  },
  barTrack: {
    width: 22,
    height: 76,
    backgroundColor: '#1a2c23',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barTrackSelected: {
    borderWidth: 1,
    borderColor: '#22d3ee',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 7,
  },
  barFillToday: {
    backgroundColor: '#22d3ee',
  },
  barFillLimit: {
    backgroundColor: '#ef4444',
  },
  barPlaceholderFill: {
    height: '8%',
  },
  barLabel: {
    color: '#5b7367',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  barLabelToday: {
    color: '#22d3ee',
    fontWeight: '800',
  },
  barLabelSelected: {
    color: '#22d3ee',
  },

  dayInsightCard: {
    marginTop: 14,
    backgroundColor: '#162720',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
  },
  dayInsightTitle: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  dayInsightBody: {
    color: '#a3b8ac',
    fontSize: 12,
    lineHeight: 17,
  },
  highlightText: {
    color: '#f1f5f3',
    fontWeight: '700',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#111d17',
    borderColor: 'rgba(56, 211, 159, 0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardSectionTitle: {
    color: '#f1f5f3',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSelectedHighlight: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#6e8579',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },

  // Platform Cards
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15251e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  platformIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  platformIconEmoji: {
    fontSize: 20,
  },
  platformDetailsCol: {
    flex: 1,
  },
  platformTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '700',
  },
  platformCountText: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '800',
  },
  platformTrack: {
    height: 7,
    backgroundColor: '#1f342a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  platformFill: {
    height: '100%',
    borderRadius: 4,
  },
  platformMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  platformTimeEstimate: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '500',
  },
  platformShareText: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '600',
  },

  igCircle: { backgroundColor: '#381c2b' },
  igFill: { backgroundColor: '#e1306c' },
  ttCircle: { backgroundColor: '#16333c' },
  ttFill: { backgroundColor: '#06b6d4' },
  ytCircle: { backgroundColor: '#381d1d' },
  ytFill: { backgroundColor: '#ef4444' },
  scCircle: { backgroundColor: '#3b3a1a' },
  scFill: { backgroundColor: '#eab308' },

  // Tip Card
  tipCard: {
    backgroundColor: '#12231b',
    borderColor: 'rgba(56, 211, 159, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipTitle: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '700',
  },
  tipText: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 19,
  },

  // Timers & Limits Screen
  tabScreenTitle: {
    color: '#f1f5f3',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  tabScreenSubtitle: {
    color: '#6e8579',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pillButton: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
    backgroundColor: '#182b22',
    borderRadius: 12,
    alignItems: 'center',
    borderColor: '#243e31',
    borderWidth: 1,
  },
  pillButtonSelected: {
    backgroundColor: '#38d39f',
    borderColor: '#38d39f',
  },
  pillButtonText: {
    color: '#9cb1a6',
    fontSize: 13,
    fontWeight: '700',
  },
  pillButtonTextSelected: {
    color: '#090e0c',
    fontWeight: '900',
  },

  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#162720',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepperBtn: {
    backgroundColor: '#1f382c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a4d3c',
  },
  stepperBtnText: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '700',
  },
  stepperLabel: {
    color: '#9cb1a6',
    fontSize: 13,
    fontWeight: '600',
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  appLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
  },
  badgeBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  badgeNormal: {
    backgroundColor: '#182b22',
    borderColor: '#284336',
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textBlocked: { color: '#f87171' },
  textNormal: { color: '#6e8579' },

  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#20342a',
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
    backgroundColor: '#f1f5f3',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },

  // Focus Mode Screen
  focusHeroCard: {
    backgroundColor: '#111d17',
    borderColor: 'rgba(56, 211, 159, 0.2)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  focusHeroCardActive: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: '#1a1414',
  },
  focusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  focusHeroTitle: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  focusLiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  focusLiveBadgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  focusLiveBadgeIdle: {
    backgroundColor: '#172720',
    borderColor: '#263d33',
  },
  focusLiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  focusLiveBadgeTextActive: { color: '#f87171' },
  focusLiveBadgeTextIdle: { color: '#6e8579' },

  focusTimerText: {
    color: '#f1f5f3',
    fontSize: 58,
    fontWeight: '900',
    marginVertical: 12,
    letterSpacing: 1,
  },
  focusHeroSubtitle: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#182b22',
    borderRadius: 10,
    marginHorizontal: 4,
    borderColor: '#263f33',
    borderWidth: 1,
  },
  presetBtnActive: {
    backgroundColor: '#38d39f',
    borderColor: '#38d39f',
  },
  presetBtnText: {
    color: '#9cb1a6',
    fontSize: 12,
    fontWeight: '700',
  },
  presetBtnTextActive: {
    color: '#090e0c',
    fontWeight: '900',
  },
  focusButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 14,
  },
  focusActionButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  focusStartButton: {
    backgroundColor: '#38d39f',
  },
  focusStopButton: {
    backgroundColor: '#ef4444',
  },
  focusActionButtonText: {
    color: '#090e0c',
    fontSize: 15,
    fontWeight: '800',
  },
  focusResetButton: {
    flex: 1,
    backgroundColor: '#1a2e24',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#294537',
  },
  focusResetButtonText: {
    color: '#9cb1a6',
    fontSize: 14,
    fontWeight: '600',
  },

  quickSelectRow: {
    flexDirection: 'row',
  },
  quickSelectBtn: {
    backgroundColor: '#1a2e24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#294335',
  },
  quickSelectBtnText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },

  masterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15251e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.2)',
  },
  masterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterToggleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  masterToggleTitle: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '700',
  },

  // Settings Screen
  healthList: {
    marginTop: 10,
    marginBottom: 14,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  healthIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    color: '#f1f5f3',
    fontSize: 14,
    fontWeight: '700',
  },
  healthDesc: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  settingsActionBtn: {
    backgroundColor: '#38d39f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  settingsActionBtnText: {
    color: '#090e0c',
    fontSize: 14,
    fontWeight: '800',
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  privacyShieldIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryOutlineBtn: {
    borderColor: '#243a2f',
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryOutlineBtnText: {
    color: '#9cb1a6',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerOutlineBtn: {
    marginTop: 12,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  dangerOutlineBtnText: {
    color: '#f87171',
    fontWeight: '700',
  },
  footerCol: {
    alignItems: 'center',
    marginVertical: 18,
  },
  footerVersion: {
    color: '#4e6258',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerTagline: {
    color: '#3c4c44',
    fontSize: 11,
    marginTop: 3,
  },

  // Bottom Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#0c1411',
    borderTopColor: 'rgba(56, 211, 159, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  tabLabel: {
    color: '#5b7367',
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38d39f',
    fontWeight: '800',
  },

  // Intro Screen Styles
  introHeader: {
    alignItems: 'center',
    marginVertical: 18,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#172c21',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.3)',
  },
  logoBadgeText: {
    fontSize: 32,
  },
  eyebrow: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: '#f1f5f3',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 34,
  },
  introSummary: {
    color: '#8aa395',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  onboardingHighlights: {
    backgroundColor: '#111d17',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.12)',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  highlightIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  highlightInfo: {
    flex: 1,
  },
  highlightTitle: {
    color: '#f1f5f3',
    fontSize: 14,
    fontWeight: '700',
  },
  highlightDesc: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  statusSection: {
    backgroundColor: '#111d17',
    borderColor: 'rgba(56, 211, 159, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: { color: '#f1f5f3', fontSize: 17, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
    borderWidth: 1,
  },
  statusBadgeInactive: {
    backgroundColor: '#19241f',
    borderColor: '#303f37',
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  statusBadgeTextActive: { color: '#4cd964' },
  statusBadgeTextInactive: { color: '#8aa395' },
  body: { color: '#9cb1a6', fontSize: 14, lineHeight: 21, marginTop: 8 },
  statusHint: { color: '#5b7367', fontSize: 12, lineHeight: 17, marginTop: 8 },
  connectedCard: {
    backgroundColor: '#0f2319',
    borderColor: 'rgba(56, 211, 159, 0.45)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  connectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedCheckBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38d39f',
    color: '#090e0c',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 10,
  },
  connectedHeaderTextWrap: {
    flex: 1,
  },
  connectedHeaderTitle: {
    color: '#f1f5f3',
    fontSize: 16,
    fontWeight: '800',
  },
  connectedHeaderSubtitle: {
    color: '#9cb1a6',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  primaryLaunchButton: {
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLaunchButtonText: {
    color: '#090e0c',
    fontSize: 15,
    fontWeight: '800',
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#38d39f',
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    width: 24,
  },
  checkboxChecked: { backgroundColor: '#38d39f' },
  checkmark: {
    color: '#090e0c',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
  },
  consentText: { color: '#d0dbd3', flex: 1, fontSize: 14, lineHeight: 20 },
  button: {
    alignItems: 'center',
    backgroundColor: '#38d39f',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  buttonDisabled: { backgroundColor: '#1d2e25' },
  buttonText: {
    color: '#090e0c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  settingsHint: {
    color: '#5b7367',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    textAlign: 'center',
  },
  error: { color: '#f87171', fontSize: 13, lineHeight: 18, marginTop: 10 },
  enterDashboardButton: {
    alignItems: 'center',
    borderColor: 'rgba(56, 211, 159, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 48,
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
  },
  enterDashboardButtonText: {
    color: '#38d39f',
    fontSize: 15,
    fontWeight: '700',
  },

  // Mindful Breathing Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  breatheModalCard: {
    width: '100%',
    backgroundColor: '#111d17',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  breatheModalEyebrow: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  breatheModalTitle: {
    color: '#f1f5f3',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  breatheModalDesc: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  breatheVisualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  breatheRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheRingInhale: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  breatheRingHold: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  breatheRingExhale: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  breatheRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathePhaseText: {
    color: '#f1f5f3',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  breatheCycleCount: {
    color: '#9cb1a6',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  breatheRemainingText: {
    color: '#6e8579',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 18,
  },
  breatheCloseBtn: {
    width: '100%',
    paddingVertical: 13,
    backgroundColor: '#1b2d24',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b473a',
  },
  breatheCloseBtnText: {
    color: '#9cb1a6',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default App;
