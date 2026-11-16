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
type CravingTab = 'breathing' | 'delay' | 'grounding' | 'stroop';
type HudStyle = 'pill' | 'dot' | 'warning_only';
type ThemeAccent = 'emerald' | 'cyan' | 'amethyst' | 'amber' | 'monochrome';
type UserMood = 'zen' | 'focused' | 'distracted' | 'craving';
type FocusSoundscape = 'rain' | 'forest' | 'waves' | 'cafe' | 'cosmic' | 'none';
type TriggerType = 'boredom' | 'stress' | 'procrastination' | 'habit' | 'fomo';


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
  const [weeklyRecapAlert, setWeeklyRecapAlert] = useState(true);
  const [hudStyle, setHudStyle] = useState<HudStyle>('pill');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('emerald');
  const [selectedIntention, setSelectedIntention] = useState<string>(
    'Deep Work First, Feeds Later',
  );
  const [todayMood, setTodayMood] = useState<UserMood | null>(null);
  const [dopamineFastActive, setDopamineFastActive] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<FocusSoundscape>('rain');
  const [soundscapePlaying, setSoundscapePlaying] = useState<boolean>(false);

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

  // Mindful Breathing & Craving SOS Tool state
  const [showCravingModal, setShowCravingModal] = useState(false);
  const [cravingTab, setCravingTab] = useState<CravingTab>('breathing');
  const [breathePhase, setBreathePhase] = useState<BreathePhase>('Inhale');
  const [breatheSecondsRemaining, setBreatheSecondsRemaining] = useState(60);
  const [breatheCycleSec, setBreatheCycleSec] = useState(4);
  const [delaySeconds, setDelaySeconds] = useState(90);
  const [delayRunning, setDelayRunning] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);
  // Zen Mastery & XP Progression
  const [zenXp, setZenXp] = useState(380);
  const [dailyQuestsClaimed, setDailyQuestsClaimed] = useState<{
    compass: boolean;
    reset: boolean;
    shield: boolean;
    cap: boolean;
  }>({
    compass: true,
    reset: false,
    shield: false,
    cap: false,
  });

  // Stroop Cognitive Challenge State
  const [stroopRound, setStroopRound] = useState(0);
  const [stroopFeedback, setStroopFeedback] = useState<string | null>(null);
  const [stroopFinished, setStroopFinished] = useState(false);

  // 24-Hour Dopamine Clock
  const [selectedDopamineHour, setSelectedDopamineHour] = useState<number>(new Date().getHours());

  // Trigger & Craving Journal
  const [triggersLog, setTriggersLog] = useState<Record<TriggerType, number>>({
    boredom: 3,
    stress: 2,
    procrastination: 4,
    habit: 5,
    fomo: 1,
  });
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>('procrastination');

  // Soundscape Duration
  const [soundscapeDurationMins, setSoundscapeDurationMins] = useState(25);


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
            if (status.hudStyle) {
              setHudStyle(status.hudStyle as HudStyle);
            }
            if (status.bedtimeShieldEnabled !== undefined) {
              setBedtimeShield(status.bedtimeShieldEnabled);
            }
            if (status.doomscrollAlertEnabled !== undefined) {
              setDoomscrollAlert(status.doomscrollAlertEnabled);
            }
            if (status.breakReminderEnabled !== undefined) {
              setBreakReminder(status.breakReminderEnabled);
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
    if (showCravingModal && cravingTab === 'breathing' && breatheSecondsRemaining > 0) {
      interval = setInterval(() => {
        setBreatheSecondsRemaining(prev => {
          if (prev <= 1) {
            setShowCravingModal(false);
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
  }, [showCravingModal, cravingTab, breatheSecondsRemaining]);

  // 90-Second Craving Surge Delay Engine
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (delayRunning && delaySeconds > 0) {
      interval = setInterval(() => {
        setDelaySeconds(prev => {
          if (prev <= 1) {
            setDelayRunning(false);
            Alert.alert(
              'Craving Wave Surfed! 🌊',
              'Awesome impulse victory! You waited out the craving spike and allowed your prefrontal cortex to regain control.',
            );
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [delayRunning, delaySeconds]);

  const openCravingModal = (tab: CravingTab = 'breathing') => {
    setCravingTab(tab);
    setShowCravingModal(true);
  };

  const toggleSoundscapeAudio = (targetPlaying?: boolean, soundscapeType: FocusSoundscape = soundscape) => {
    const nextPlaying = targetPlaying !== undefined ? targetPlaying : !soundscapePlaying;
    setSoundscapePlaying(nextPlaying);
    if (nextPlaying) {
      PrototypeSettings.playSoundscape(soundscapeType, soundscapeDurationMins).catch(() => {});
    } else {
      PrototypeSettings.stopSoundscape().catch(() => {});
    }
  };

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

  // Dynamic Mindful Streak
  const calculateStreak = () => {
    let streak = 0;
    if (totalShorts <= dailyLimit) {
      streak += 1;
    }
    for (let i = dayHistory.length - 2; i >= 0; i--) {
      const item = dayHistory[i];
      if (item && item.count <= dailyLimit) {
        streak += 1;
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  };
  const mindfulStreak = calculateStreak();

  // Life Reclaimed Beyond Screen
  const typicalDailyDoomscrollMins = 90;
  const timeSavedMins = Math.max(0, typicalDailyDoomscrollMins - estMinutes);
  const bookPagesEquivalent = Math.max(1, Math.round(estMinutes * 0.75));
  const walkingStepsEquivalent = Math.max(50, Math.round(estMinutes * 95));

  // Chrono-Shield Vulnerability Assessment
  const getChronoAnalysis = () => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 5) {
      return {
        level: 'Critical Vulnerability',
        badgeColor: '#f87171',
        icon: '🌙',
        title: 'Melatonin & Deep Sleep Disruption',
        advice: 'Scrolling past 10 PM delays REM sleep by up to 90 minutes. Engage the Bedtime Shield now.',
      };
    }
    if (hour >= 13 && hour < 17) {
      return {
        level: 'Moderate Slump Risk',
        badgeColor: '#fbbf24',
        icon: '⚡',
        title: 'Afternoon Dopamine Fatigue',
        advice: 'Post-lunch cognitive drops trigger reflex swipes. Swap phone for 5 minutes of sunlight or cold water.',
      };
    }
    if (hour >= 5 && hour < 11) {
      return {
        level: 'Protected Morning Window',
        badgeColor: '#38d39f',
        icon: '☀️',
        title: 'Morning Cortisol Alignment',
        advice: 'Keeping your first 60 minutes screen-free primes dopamine baseline for the entire day.',
      };
    }
    return {
      level: 'Evening Transition Zone',
      badgeColor: '#a78bfa',
      icon: '🌇',
      title: 'Evening Decompression',
      advice: 'Avoid doomscrolling while unwinding. Give your eyes and mind real physical downtime.',
    };
  };

  const chronoShield = getChronoAnalysis();

  const milestones = [
    {
      id: 'cap',
      icon: '🎯',
      name: 'Cap Champion',
      desc: 'Inside daily target',
      unlocked: totalShorts <= dailyLimit,
    },
    {
      id: 'zen',
      icon: '🧘',
      name: 'Zen Master',
      desc: 'Used Craving Reset',
      unlocked: true,
    },
    {
      id: 'shield',
      icon: '🛡️',
      name: 'Focus Guardian',
      desc: 'Protected deep work',
      unlocked: focusTimerRunning || focusTimerSeconds < 15 * 60,
    },
    {
      id: 'streak',
      icon: '🔥',
      name: `${mindfulStreak}d Streak`,
      desc: 'Consistent impulse control',
      unlocked: mindfulStreak >= 1,
    },
  ];

  const groundingSteps = [
    {
      num: 5,
      sense: '👀 SEE',
      title: 'Acknowledge 5 things you can see',
      prompt: 'Look around your room or space. Notice the shapes, colors, or shadows of 5 objects.',
    },
    {
      num: 4,
      sense: '✋ FEEL',
      title: 'Acknowledge 4 things you can touch',
      prompt: 'Feel your feet on the floor, the texture of your clothing, the chair beneath you, or the cool air.',
    },
    {
      num: 3,
      sense: '👂 HEAR',
      title: 'Acknowledge 3 sounds you can hear',
      prompt: 'Listen for subtle noises: the hum of electronics, distant chatter, your breath, or outdoor ambience.',
    },
    {
      num: 2,
      sense: '👃 SMELL',
      title: 'Acknowledge 2 things you can smell',
      prompt: 'Take two conscious inhalations through your nose. Notice any ambient scent in the air.',
    },
    {
      num: 1,
      sense: '👅 TASTE',
      title: 'Acknowledge 1 thing you can taste',
      prompt: 'Swallow, relax your jaw, or take a sip of cool water. Feel your prefrontal cortex return to clarity.',
    },
  ];

  const themeColors = {
    emerald: {
      primary: '#38d39f',
      primaryDark: '#10b981',
      glow: 'rgba(56, 211, 159, 0.15)',
      border: 'rgba(56, 211, 159, 0.4)',
      name: 'Emerald Sanctuary',
      icon: '🌿',
    },
    cyan: {
      primary: '#22d3ee',
      primaryDark: '#06b6d4',
      glow: 'rgba(34, 211, 238, 0.15)',
      border: 'rgba(34, 211, 238, 0.4)',
      name: 'Cyber Cyan',
      icon: '🌌',
    },
    amethyst: {
      primary: '#c084fc',
      primaryDark: '#a855f7',
      glow: 'rgba(192, 132, 252, 0.15)',
      border: 'rgba(192, 132, 252, 0.4)',
      name: 'Deep Amethyst',
      icon: '🔮',
    },
    amber: {
      primary: '#fbbf24',
      primaryDark: '#f59e0b',
      glow: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.4)',
      name: 'Solar Amber',
      icon: '🌅',
    },
    monochrome: {
      primary: '#e4e4e7',
      primaryDark: '#a1a1aa',
      glow: 'rgba(244, 244, 245, 0.12)',
      border: 'rgba(244, 244, 245, 0.35)',
      name: 'Obsidian Minimalist',
      icon: '🌑',
    },
  };

  const currentTheme = themeColors[themeAccent];

  // Zen Level & Attention Mastery
  const getZenLevel = (xp: number) => {
    if (xp >= 1200) return { level: 5, title: 'Zen Grandmaster', icon: '🌟', min: 1200, max: 2000 };
    if (xp >= 700) return { level: 4, title: 'Attention Sovereign', icon: '👑', min: 700, max: 1200 };
    if (xp >= 350) return { level: 3, title: 'Dopamine Alchemist', icon: '🔮', min: 350, max: 700 };
    if (xp >= 150) return { level: 2, title: 'Feed Resistor', icon: '🛡️', min: 150, max: 350 };
    return { level: 1, title: 'Mindful Spark', icon: '🌱', min: 0, max: 150 };
  };
  const zenLevel = getZenLevel(zenXp);
  const xpInCurrentLevel = zenXp - zenLevel.min;
  const xpNeededForLevel = zenLevel.max - zenLevel.min;
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

  // Stroop Cognitive Conflict Trials
  const STROOP_TRIALS = [
    { text: 'BLUE', color: '#38d39f', colorName: 'Emerald' },
    { text: 'RED', color: '#22d3ee', colorName: 'Cyan' },
    { text: 'AMBER', color: '#c084fc', colorName: 'Amethyst' },
    { text: 'GREEN', color: '#fbbf24', colorName: 'Amber' },
    { text: 'CYAN', color: '#38d39f', colorName: 'Emerald' },
  ];

  const handleStroopAnswer = (chosenColorName: string) => {
    const currentTrial = STROOP_TRIALS[stroopRound % STROOP_TRIALS.length];
    if (chosenColorName === currentTrial.colorName) {
      if (stroopRound >= 2) {
        setStroopFinished(true);
        setZenXp(prev => prev + 40);
        setDailyQuestsClaimed(prev => ({ ...prev, reset: true }));
      } else {
        setStroopRound(prev => prev + 1);
        setStroopFeedback('✨ Correct! Prefrontal cortex taking over.');
      }
    } else {
      setStroopFeedback('⚠️ Autopilot reflex detected! Focus on the INK COLOR.');
    }
  };

  const resetStroop = () => {
    setStroopRound(0);
    setStroopFeedback(null);
    setStroopFinished(false);
  };

  // 24-Hour Dopamine Clock Analysis
  const getHourDopamineProfile = (h: number) => {
    if (h >= 6 && h < 11) {
      return {
        period: 'Morning Awakening & Focus',
        risk: 'Low Risk · High Willpower',
        color: '#38d39f',
        icon: '☀️',
        tip: 'Cortisol awakening response primes natural clarity. Keep short feeds locked during this sacred window.',
      };
    }
    if (h >= 11 && h < 14) {
      return {
        period: 'Peak Execution Window',
        risk: 'Optimal Productivity',
        color: '#22d3ee',
        icon: '🎯',
        tip: 'High executive stamina. Perfect time for deep work sprints before the afternoon energy dip.',
      };
    }
    if (h >= 14 && h < 18) {
      return {
        period: 'Afternoon Slump & Vulnerability',
        risk: 'High Vulnerability Spike',
        color: '#fbbf24',
        icon: '⚡',
        tip: 'Natural circadian dip in core temperature & dopamine. Brain seeks instant gratification. Use Focus Shield.',
      };
    }
    if (h >= 18 && h < 22) {
      return {
        period: 'Twilight Leisure & Social',
        risk: 'Moderate Risk',
        color: '#a78bfa',
        icon: '🌇',
        tip: 'Conscious wind-down time. Choose books, walks, or real conversations over mindless vertical swipes.',
      };
    }
    return {
      period: 'Melatonin Guard & Sleep Recovery',
      risk: 'Critical Disruption Zone',
      color: '#f87171',
      icon: '🌙',
      tip: 'Short-form rapid video suppresses melatonin synthesis by up to 90 min. Keep phone away from bed.',
    };
  };

  const selectedHourProfile = getHourDopamineProfile(selectedDopamineHour);

  // Trigger Details & Behavioral Hacks
  const TRIGGER_DATA: Record<TriggerType, { label: string; icon: string; advice: string }> = {
    boredom: {
      label: 'Boredom',
      icon: '🥱',
      advice: 'Boredom is the brain seeking stimulation. Channel it into a 2-minute physical stretch or hydration.',
    },
    stress: {
      label: 'Stress & Anxiety',
      icon: '😓',
      advice: 'Doomscrolling adds cognitive cortisol. Use the 4-4-4 Box Breathing reset to down-regulate your nervous system.',
    },
    procrastination: {
      label: 'Procrastination',
      icon: '⏳',
      advice: 'Try the 2-Minute Rule: commit to doing just 120 seconds of your pending task. Starting breaks the freeze.',
    },
    habit: {
      label: 'Muscle Memory',
      icon: '🔁',
      advice: 'Your thumb unlocked out of reflex. The Mindful Floating HUD is here to make the invisible visible.',
    },
    fomo: {
      label: 'FOMO',
      icon: '👥',
      advice: 'Algorithms manufacture synthetic urgency. Nothing happening on social media warrants losing your focus today.',
    },
  };

  const handleLogTrigger = (t: TriggerType) => {
    setTriggersLog(prev => ({ ...prev, [t]: prev[t] + 1 }));
    setSelectedTrigger(t);
    setZenXp(prev => prev + 10);
    Alert.alert(
      `${TRIGGER_DATA[t].icon} Impulse Acknowledged (+10 XP)`,
      TRIGGER_DATA[t].advice,
    );
  };


  // Digital Wellbeing Vitality Score (0-100)
  const calculateVitalityScore = () => {
    let score = 100;
    if (totalShorts > dailyLimit) {
      const over = totalShorts - dailyLimit;
      score -= Math.min(45, over * 2);
    } else {
      const headroom = dailyLimit - totalShorts;
      score += Math.min(5, Math.floor(headroom / 10));
    }
    if (estMinutes > dailyTimeLimitMin) {
      score -= Math.min(30, (estMinutes - dailyTimeLimitMin) * 1.5);
    }
    score += Math.min(10, mindfulStreak * 2);
    if (bedtimeShield) {
      score += 5;
    }
    return Math.max(10, Math.min(100, Math.round(score)));
  };

  const vitalityScore = calculateVitalityScore();

  const intentionsList = [
    { id: '1', title: 'Deep Work First, Feeds Later', icon: '🛡️' },
    { id: '2', title: 'Conscious Intent, No Idle Swipes', icon: '🌿' },
    { id: '3', title: 'Screens Off 1hr Before Sleep', icon: '🌙' },
    { id: '4', title: 'Three Breaths Before Unlocking', icon: '🧘' },
  ];

  const soundscapesList = [
    { id: 'rain' as FocusSoundscape, name: 'Gentle Rain', icon: '🌧️', desc: 'Calming rain drops' },
    { id: 'forest' as FocusSoundscape, name: 'Pine Forest', icon: '🌲', desc: 'Wind through trees' },
    { id: 'waves' as FocusSoundscape, name: 'Ocean Waves', icon: '🌊', desc: 'Rhythmic surf' },
    { id: 'cafe' as FocusSoundscape, name: 'Quiet Library', icon: '☕', desc: 'Soft ambient hum' },
    { id: 'cosmic' as FocusSoundscape, name: 'Cosmic Binaural', icon: '🌌', desc: '432Hz deep focus' },
  ];

  const moodsList = [
    { id: 'zen' as UserMood, label: 'Zen & Calm', icon: '😊', tip: 'Your mind is present and centered.' },
    { id: 'focused' as UserMood, label: 'Laser Focused', icon: '🎯', tip: 'Keep this deep momentum going.' },
    { id: 'distracted' as UserMood, label: 'Mildly Restless', icon: '😐', tip: 'Take a sip of water or 1m breath.' },
    { id: 'craving' as UserMood, label: 'Overstimulated', icon: '🌊', tip: 'Surf the wave with Craving SOS.' },
  ];

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

      {/* Daily Intention Anchor */}
      <View style={styles.intentionCard}>
        <View style={styles.intentionHeaderRow}>
          <Text style={styles.intentionEyebrow}>DAILY COMPASS</Text>
          <Text style={styles.intentionTag}>Conscious Intent</Text>
        </View>
        <Text style={styles.intentionText}>"{selectedIntention}"</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intentionPillsRow}>
          {intentionsList.map(item => (
            <Pressable
              key={item.id}
              onPress={() => setSelectedIntention(item.title)}
              style={[
                styles.intentionPill,
                selectedIntention === item.title && styles.intentionPillSelected,
              ]}
            >
              <Text style={styles.intentionPillIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.intentionPillText,
                  selectedIntention === item.title && styles.intentionPillTextSelected,
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Digital Wellbeing Vitality Score Banner */}
      <View style={styles.vitalityCard}>
        <View style={styles.vitalityLeftCol}>
          <Text style={styles.vitalityEyebrow}>DIGITAL WELLBEING VITALITY</Text>
          <View style={styles.vitalityScoreRow}>
            <Text style={styles.vitalityScoreNum}>{vitalityScore}</Text>
            <Text style={styles.vitalityScoreMax}>/ 100</Text>
          </View>
          <Text style={styles.vitalityStatusText}>
            {vitalityScore >= 85
              ? '🌟 Optimal Flow — High clarity & minimal reflex distraction'
              : vitalityScore >= 65
              ? '🌱 Healthy Balance — Good awareness; keep under daily cap'
              : '⚡ High Dopamine Drag — Engage Craving SOS to reset'}
          </Text>
        </View>
        <View style={styles.vitalityRingWrap}>
          <View
            style={[
              styles.vitalityMiniRing,
              vitalityScore >= 85
                ? styles.vitalityRingHigh
                : vitalityScore >= 65
                ? styles.vitalityRingMed
                : styles.vitalityRingLow,
            ]}
          >
            <Text style={styles.vitalityRingIcon}>
              {vitalityScore >= 85 ? '✨' : vitalityScore >= 65 ? '🌿' : '⚡'}
            </Text>
          </View>
        </View>
      </View>

      {/* Attention Mastery & Zen XP Card */}
      <View style={styles.masteryCard}>
        <View style={styles.masteryTopRow}>
          <View style={styles.masteryBadgeRow}>
            <Text style={styles.masteryLevelIcon}>{zenLevel.icon}</Text>
            <View>
              <Text style={styles.masteryEyebrow}>ATTENTION MASTERY · LEVEL {zenLevel.level}</Text>
              <Text style={styles.masteryTitle}>{zenLevel.title}</Text>
            </View>
          </View>
          <View style={styles.masteryXpPill}>
            <Text style={styles.masteryXpText}>{zenXp} XP</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.masteryProgressTrack}>
          <View style={[styles.masteryProgressFill, { width: `${xpPercent}%` }]} />
        </View>
        <View style={styles.masteryProgressLabels}>
          <Text style={styles.masteryProgressSub}>
            {xpInCurrentLevel} / {xpNeededForLevel} XP in tier ({xpPercent}%)
          </Text>
          <Text style={styles.masteryProgressNext}>Next: Lvl {Math.min(5, zenLevel.level + 1)}</Text>
        </View>

        {/* Daily Mindful Quests */}
        <Text style={styles.questsHeader}>DAILY MINDFUL QUESTS</Text>
        <View style={styles.questsGrid}>
          <Pressable
            onPress={() => {
              if (!dailyQuestsClaimed.compass) {
                setDailyQuestsClaimed(prev => ({ ...prev, compass: true }));
                setZenXp(prev => prev + 20);
                Alert.alert('Quest Complete! 🎯', '+20 XP added for setting your daily intention compass.');
              }
            }}
            style={[styles.questItem, dailyQuestsClaimed.compass && styles.questItemDone]}
          >
            <Text style={styles.questIcon}>{dailyQuestsClaimed.compass ? '✓' : '🎯'}</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Daily Compass</Text>
              <Text style={styles.questReward}>+20 XP · Intent Set</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => openCravingModal('stroop')}
            style={[styles.questItem, dailyQuestsClaimed.reset && styles.questItemDone]}
          >
            <Text style={styles.questIcon}>{dailyQuestsClaimed.reset ? '✓' : '🧠'}</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Stroop Reset</Text>
              <Text style={styles.questReward}>+40 XP · Tap to Play</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleQuickFocus15m}
            style={[styles.questItem, (focusTimerRunning || dailyQuestsClaimed.shield) && styles.questItemDone]}
          >
            <Text style={styles.questIcon}>{focusTimerRunning || dailyQuestsClaimed.shield ? '✓' : '🛡️'}</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Focus Shield</Text>
              <Text style={styles.questReward}>+50 XP · 15m Sprint</Text>
            </View>
          </Pressable>

          <View style={[styles.questItem, totalShorts <= dailyLimit && styles.questItemDone]}>
            <Text style={styles.questIcon}>{totalShorts <= dailyLimit ? '✓' : '📉'}</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Stay Under Cap</Text>
              <Text style={styles.questReward}>+100 XP · At Midnight</Text>
            </View>
          </View>
        </View>
      </View>

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
              onPress={() => openCravingModal('breathing')}
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
            <Text style={styles.heroStatValue}>{mindfulStreak} {mindfulStreak === 1 ? 'Day' : 'Days'}</Text>
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

      {/* Craving SOS / Urge Surfer Action Banner */}
      <View style={styles.cravingSosBanner}>
        <View style={styles.cravingSosHeaderRow}>
          <View style={styles.cravingSosBadge}>
            <Text style={styles.cravingSosBadgeText}>⚡ CRAVING SOS</Text>
          </View>
          <Text style={styles.cravingSosWaveTag}>Impulse Interrupter</Text>
        </View>
        <Text style={styles.cravingSosTitle}>Feeling the urge to swipe?</Text>
        <Text style={styles.cravingSosDesc}>
          Urges peak in 90 seconds. Interrupt the reflex loop with breathwork, wave delay, or sensory grounding.
        </Text>
        <View style={styles.cravingSosBtnRow}>
          <Pressable
            onPress={() => openCravingModal('delay')}
            style={styles.cravingSosPrimaryBtn}
          >
            <Text style={styles.cravingSosPrimaryBtnText}>🌊 90s Wave Surfer</Text>
          </Pressable>
          <Pressable
            onPress={() => openCravingModal('breathing')}
            style={styles.cravingSosSecondaryBtn}
          >
            <Text style={styles.cravingSosSecondaryBtnText}>🧘 4-4-4 Box Breath</Text>
          </Pressable>
          <Pressable
            onPress={() => openCravingModal('grounding')}
            style={styles.cravingSosSecondaryBtn}
          >
            <Text style={styles.cravingSosSecondaryBtnText}>🌿 Grounding</Text>
          </Pressable>
        </View>
      </View>

      {/* Life Reclaimed Beyond Screen Card */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>🌱 Life Beyond Feeds</Text>
          <Text style={styles.cardSelectedHighlight}>~{timeSavedMins}m Saved</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Real-world experiences reclaimed compared to typical 90m doomscrolling.
        </Text>
        <View style={styles.lifeReclaimedGrid}>
          <View style={styles.lifeReclaimedCard}>
            <Text style={styles.lifeReclaimedIcon}>⏱️</Text>
            <Text style={styles.lifeReclaimedValue}>~{timeSavedMins}m</Text>
            <Text style={styles.lifeReclaimedLabel}>Time Reclaimed</Text>
          </View>
          <View style={styles.lifeReclaimedCard}>
            <Text style={styles.lifeReclaimedIcon}>📚</Text>
            <Text style={styles.lifeReclaimedValue}>{bookPagesEquivalent} pgs</Text>
            <Text style={styles.lifeReclaimedLabel}>Book Reading Equiv</Text>
          </View>
          <View style={styles.lifeReclaimedCard}>
            <Text style={styles.lifeReclaimedIcon}>🚶</Text>
            <Text style={styles.lifeReclaimedValue}>{walkingStepsEquivalent}</Text>
            <Text style={styles.lifeReclaimedLabel}>Physical Steps Equiv</Text>
          </View>
          <View style={styles.lifeReclaimedCard}>
            <Text style={styles.lifeReclaimedIcon}>🧠</Text>
            <Text style={styles.lifeReclaimedValue}>Grounded</Text>
            <Text style={styles.lifeReclaimedLabel}>Dopamine State</Text>
          </View>
        </View>
      </View>

      {/* Chrono-Shield Vulnerability Analyzer */}
      <View style={styles.sectionCard}>
        <View style={styles.chronoHeaderRow}>
          <Text style={styles.chronoIcon}>{chronoShield.icon}</Text>
          <View style={styles.chronoTitleWrap}>
            <View style={styles.chronoBadgeRow}>
              <Text style={[styles.chronoLevelBadge, { color: chronoShield.badgeColor }]}>
                {chronoShield.level.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.chronoTitle}>{chronoShield.title}</Text>
          </View>
        </View>
        <Text style={styles.chronoAdviceText}>{chronoShield.advice}</Text>
      </View>


      {/* Mindful Intercept Gate - Neural Circuit Breaker */}
      <View style={styles.interceptCard}>
        <View style={styles.interceptTopRow}>
          <Text style={styles.interceptEmoji}>🧠</Text>
          <View style={styles.interceptTitleCol}>
            <Text style={styles.interceptEyebrow}>NEURAL CIRCUIT BREAKER</Text>
            <Text style={styles.interceptTitle}>Mindful Intercept Gate</Text>
          </View>
        </View>
        <Text style={styles.interceptDesc}>
          Compulsive scrolling is driven by autonomic basal-ganglia reflex. Engaging prefrontal color-word conflict breaks the dopamine urge.
        </Text>
        <Pressable
          onPress={() => {
            resetStroop();
            openCravingModal('stroop');
          }}
          style={styles.interceptActionBtn}
        >
          <Text style={styles.interceptActionBtnText}>⚡ Challenge Urge with Stroop Test (+40 XP) →</Text>
        </Pressable>
      </View>

      {/* 24-Hour Dopamine Matrix & Attention Clock */}
      <View style={styles.sectionCard}>
        <View style={styles.clockHeaderRow}>
          <View>
            <Text style={styles.cardSectionEyebrow}>CIRCADIAN DOPAMINE MATRIX</Text>
            <Text style={styles.cardSectionTitle}>24-Hour Attention Clock</Text>
          </View>
          <View style={styles.liveNowPill}>
            <View style={styles.liveNowDot} />
            <Text style={styles.liveNowText}>Hour {new Date().getHours()}:00</Text>
          </View>
        </View>

        {/* 24-Hour Scrollable Hourly Bar Dial */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyBarRow}>
          {Array.from({ length: 24 }).map((_, h) => {
            const prof = getHourDopamineProfile(h);
            const isSelected = selectedDopamineHour === h;
            const isCurrent = new Date().getHours() === h;

            return (
              <Pressable
                key={h}
                onPress={() => setSelectedDopamineHour(h)}
                style={[
                  styles.hourlyBarItem,
                  isSelected && styles.hourlyBarItemSelected,
                  isCurrent && styles.hourlyBarItemCurrent,
                ]}
              >
                <Text style={[styles.hourlyBarHourText, isSelected && styles.hourlyBarTextActive]}>
                  {h.toString().padStart(2, '0')}
                </Text>
                <View style={[styles.hourlyBarIndicator, { backgroundColor: prof.color }]} />
                <Text style={styles.hourlyBarEmoji}>{prof.icon}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected Hour Insight Card */}
        <View style={[styles.hourInsightBox, { borderColor: selectedHourProfile.color }]}>
          <View style={styles.hourInsightHeader}>
            <Text style={styles.hourInsightIcon}>{selectedHourProfile.icon}</Text>
            <View style={styles.hourInsightTitleCol}>
              <Text style={styles.hourInsightTimeRange}>
                {selectedDopamineHour.toString().padStart(2, '0')}:00 –{' '}
                {((selectedDopamineHour + 1) % 24).toString().padStart(2, '0')}:00
              </Text>
              <Text style={[styles.hourInsightRisk, { color: selectedHourProfile.color }]}>
                {selectedHourProfile.risk}
              </Text>
            </View>
          </View>
          <Text style={styles.hourInsightPeriodTitle}>{selectedHourProfile.period}</Text>
          <Text style={styles.hourInsightTip}>{selectedHourProfile.tip}</Text>
        </View>
      </View>

      {/* Impulse & Trigger Awareness Journal */}
      <View style={styles.sectionCard}>
        <View style={styles.triggerHeaderRow}>
          <View>
            <Text style={styles.cardSectionEyebrow}>SELF-AWARENESS TRACKER</Text>
            <Text style={styles.cardSectionTitle}>Why did you reach for feeds?</Text>
          </View>
          <Text style={styles.triggerXpHint}>+10 XP / log</Text>
        </View>
        <Text style={styles.triggerSubText}>
          Logging the emotion behind the impulse disarms unconscious muscle memory.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.triggerPillsRow}>
          {(Object.keys(TRIGGER_DATA) as TriggerType[]).map(t => {
            const data = TRIGGER_DATA[t];
            const isSelected = selectedTrigger === t;
            const count = triggersLog[t] || 0;

            return (
              <Pressable
                key={t}
                onPress={() => handleLogTrigger(t)}
                style={[styles.triggerPill, isSelected && styles.triggerPillSelected]}
              >
                <Text style={styles.triggerPillIcon}>{data.icon}</Text>
                <Text style={[styles.triggerPillLabel, isSelected && styles.triggerPillLabelSelected]}>
                  {data.label}
                </Text>
                <View style={styles.triggerCountBadge}>
                  <Text style={styles.triggerCountBadgeText}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Dynamic Behavioral Hack for Selected Trigger */}
        <View style={styles.triggerAdviceCard}>
          <Text style={styles.triggerAdviceEyebrow}>
            {TRIGGER_DATA[selectedTrigger].icon} NEURO-REPLACEMENT PROTOCOL
          </Text>
          <Text style={styles.triggerAdviceBody}>{TRIGGER_DATA[selectedTrigger].advice}</Text>
        </View>
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

      {/* Mindful Milestones & Badges */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>🏆 Mindful Milestones</Text>
          <Text style={styles.cardSelectedHighlight}>
            {milestones.filter(m => m.unlocked).length} of 4 Unlocked
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Habit trophies celebrating impulse control and conscious digital presence.
        </Text>
        <View style={styles.milestonesGrid}>
          {milestones.map(badge => (
            <View
              key={badge.id}
              style={[
                styles.milestoneBadgeCard,
                badge.unlocked ? styles.milestoneUnlocked : styles.milestoneLocked,
              ]}
            >
              <Text style={styles.milestoneIcon}>{badge.icon}</Text>
              <Text
                style={[
                  styles.milestoneName,
                  badge.unlocked ? styles.milestoneNameUnlocked : styles.milestoneNameLocked,
                ]}
              >
                {badge.name}
              </Text>
              <Text style={styles.milestoneDesc}>{badge.desc}</Text>
              <View
                style={[
                  styles.milestoneStatusTag,
                  badge.unlocked ? styles.milestoneStatusTagUnlocked : styles.milestoneStatusTagLocked,
                ]}
              >
                <Text
                  style={[
                    styles.milestoneStatusText,
                    badge.unlocked ? styles.milestoneStatusTextUnlocked : styles.milestoneStatusTextLocked,
                  ]}
                >
                  {badge.unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                </Text>
              </View>
            </View>
          ))}
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

      {/* Daily Reflection & Mind Check-In */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>🧠 Attention & Mood Check-In</Text>
          <Text style={styles.cardSelectedHighlight}>
            {todayMood ? moodsList.find(m => m.id === todayMood)?.label : 'Log Feeling'}
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Reflect on how your cognitive energy and impulse clarity feel right now.
        </Text>
        <View style={styles.moodGrid}>
          {moodsList.map(moodItem => (
            <Pressable
              key={moodItem.id}
              onPress={() => setTodayMood(moodItem.id)}
              style={[
                styles.moodCard,
                todayMood === moodItem.id && styles.moodCardSelected,
              ]}
            >
              <Text style={styles.moodIcon}>{moodItem.icon}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  todayMood === moodItem.id && styles.moodLabelSelected,
                ]}
              >
                {moodItem.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {todayMood && (
          <View style={styles.moodTipBox}>
            <Text style={styles.moodTipText}>
              💡 {moodsList.find(m => m.id === todayMood)?.tip}
            </Text>
          </View>
        )}
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
            PrototypeSettings.setBedtimeShield(next, 23, 6).catch(() => {});
            Alert.alert(
              next ? 'Bedtime Shield Active 🌙' : 'Bedtime Shield Disabled',
              next
                ? 'Distracting feeds will be strictly blocked between 11:00 PM and 6:00 AM.'
                : 'Nighttime automatic lock has been turned off.',
            );
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Auto-Lock Between 11 PM - 6 AM</Text>
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
          onPress={() => {
            const next = !breakReminder;
            setBreakReminder(next);
            PrototypeSettings.setBreakReminder(next).catch(() => {});
          }}
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
          onPress={() => {
            const next = !doomscrollAlert;
            setDoomscrollAlert(next);
            PrototypeSettings.setDoomscrollAlert(next).catch(() => {});
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Doomscroll Loop Alert & Haptic</Text>
            <Text style={styles.toggleSubtitle}>
              Vibrates & alerts after 15 consecutive shorts to break compulsive scrolling.
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

        <Pressable
          onPress={() => setWeeklyRecapAlert(prev => !prev)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Weekly Mindful Habit Recap</Text>
            <Text style={styles.toggleSubtitle}>
              Sunday evening summary comparing your weekly scrolls against your streak.
            </Text>
          </View>
          <View
            style={[styles.switchTrack, weeklyRecapAlert && styles.switchTrackOn]}
          >
            <View
              style={[
                styles.switchThumb,
                weeklyRecapAlert && styles.switchThumbOn,
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

      {/* 24-Hour Dopamine Sabbath */}
      <View style={[styles.sectionCard, dopamineFastActive && styles.sabbathCardActive]}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>🧘 24-Hour Digital Sabbath</Text>
          <View style={[styles.statusBadgeSmall, dopamineFastActive ? styles.badgeBlocked : styles.badgeNormal]}>
            <Text style={[styles.statusBadgeSmallText, dopamineFastActive ? styles.textBlocked : styles.textNormal]}>
              {dopamineFastActive ? 'FAST ACTIVE' : 'READY'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Lock all short-form feeds for 24 hours to deeply reset baseline dopamine sensitivity.
        </Text>
        <Pressable
          onPress={() => {
            const next = !dopamineFastActive;
            setDopamineFastActive(next);
            if (next) {
              const allPkgs = Object.values(TARGET_PACKAGES);
              PrototypeSettings.setFocusMode(true, 1440, allPkgs).catch(() => {});
              setFocusTimerSeconds(1440 * 60);
              setFocusTimerRunning(true);
              setFocusModeActive(true);
              Alert.alert(
                '24-Hour Digital Sabbath Begun! 🧘',
                'All monitored feeds are strictly locked until tomorrow. Reclaim your stillness.',
              );
            } else {
              PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
              setFocusTimerRunning(false);
              setFocusModeActive(false);
              Alert.alert('Digital Sabbath Ended', 'Distraction feeds have been unlocked.');
            }
          }}
          style={[styles.sabbathBtn, dopamineFastActive && styles.sabbathBtnActive]}
        >
          <Text style={[styles.sabbathBtnText, dopamineFastActive && styles.sabbathBtnTextActive]}>
            {dopamineFastActive ? 'End 24-Hour Fast' : 'Begin 24-Hour Dopamine Fast 🌿'}
          </Text>
        </Pressable>
      </View>

      {/* Focus Soundscape Ambient Companion */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>🎧 Focus Soundscapes</Text>
          <Pressable
            onPress={() => toggleSoundscapeAudio()}
            style={styles.soundscapeToggleBtn}
          >
            <Text style={styles.soundscapeToggleBtnText}>
              {soundscapePlaying ? '⏸️ Stop Audio' : '▶️ Play Audio'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.cardSubtitle}>
          Calming ambient backdrop to accompany deep work sessions.
        </Text>
        <View style={styles.soundscapeRow}>
          {soundscapesList.map(sItem => (
            <Pressable
              key={sItem.id}
              onPress={() => {
                setSoundscape(sItem.id);
                toggleSoundscapeAudio(true, sItem.id);
              }}
              style={[
                styles.soundscapeCard,
                soundscape === sItem.id && styles.soundscapeCardActive,
              ]}
            >
              <Text style={styles.soundscapeIcon}>{sItem.icon}</Text>
              <Text
                style={[
                  styles.soundscapeName,
                  soundscape === sItem.id && styles.soundscapeNameActive,
                ]}
              >
                {sItem.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {soundscapePlaying && (
          <View style={styles.equalizerRow}>
            <View style={[styles.eqBar, styles.eqBar1]} />
            <View style={[styles.eqBar, styles.eqBar2]} />
            <View style={[styles.eqBar, styles.eqBar3]} />
            <View style={[styles.eqBar, styles.eqBar4]} />
            <Text style={styles.eqLabel}>
              Playing {soundscapesList.find(s => s.id === soundscape)?.name} ({soundscapeDurationMins}m session)
            </Text>
          </View>
        )}

        {/* Soundscape Duration & Play Controls */}
        <View style={styles.soundscapeDurationRow}>
          <Text style={styles.soundscapeDurationLabel}>Duration:</Text>
          {[15, 25, 45, 60].map(mins => (
            <Pressable
              key={mins}
              onPress={() => {
                setSoundscapeDurationMins(mins);
                if (soundscapePlaying) {
                  PrototypeSettings.playSoundscape(soundscape, mins).catch(() => {});
                }
              }}
              style={[
                styles.soundscapeDurationBtn,
                soundscapeDurationMins === mins && styles.soundscapeDurationBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.soundscapeDurationBtnText,
                  soundscapeDurationMins === mins && styles.soundscapeDurationBtnTextActive,
                ]}
              >
                {mins}m
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => toggleSoundscapeAudio()}
            style={styles.soundscapePlayToggleBtn}
          >
            <Text style={styles.soundscapePlayToggleText}>
              {soundscapePlaying ? '⏸ Pause' : '▶ Play'}
            </Text>
          </Pressable>
        </View>
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

      {/* Floating HUD Style Selection */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>HUD Display Style</Text>
        <Text style={styles.cardSubtitle}>
          Choose how the on-screen live counter looks inside video apps.
        </Text>
        <View style={styles.hudStyleSelectorRow}>
          {[
            { id: 'pill' as HudStyle, label: 'Pill', icon: '🎬 14', desc: 'Badge with count' },
            { id: 'dot' as HudStyle, label: 'Compact', icon: '● 14', desc: 'Minimal dot' },
            { id: 'warning_only' as HudStyle, label: 'Stealth', icon: '⚠️ Only', desc: 'Only at limit' },
          ].map(styleOpt => (
            <Pressable
              key={styleOpt.id}
              onPress={() => {
                setHudStyle(styleOpt.id);
                PrototypeSettings.setHudStyle(styleOpt.id).catch(() => {});
                Alert.alert('HUD Style Updated', `Floating overlay set to ${styleOpt.label} mode.`);
              }}
              style={[
                styles.hudStyleCard,
                hudStyle === styleOpt.id && styles.hudStyleCardSelected,
              ]}
            >
              <Text style={styles.hudStyleIcon}>{styleOpt.icon}</Text>
              <Text
                style={[
                  styles.hudStyleLabel,
                  hudStyle === styleOpt.id && styles.hudStyleLabelSelected,
                ]}
              >
                {styleOpt.label}
              </Text>
              <Text style={styles.hudStyleDesc}>{styleOpt.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Theme Accent Customization */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Sanctuary Theme Palette</Text>
          <Text style={styles.cardSelectedHighlight}>{currentTheme.name}</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Personalize your visual accent illumination across dashboard rings and widgets.
        </Text>
        <View style={styles.themePaletteRow}>
          {(['emerald', 'cyan', 'amethyst', 'amber', 'monochrome'] as ThemeAccent[]).map(accentKey => {
            const t = themeColors[accentKey];
            const isSelected = themeAccent === accentKey;
            return (
              <Pressable
                key={accentKey}
                onPress={() => setThemeAccent(accentKey)}
                style={[
                  styles.themeChip,
                  isSelected && styles.themeChipSelected,
                ]}
              >
                <Text style={styles.themeChipIcon}>{t.icon}</Text>
                <Text style={[styles.themeChipName, isSelected && styles.themeChipNameSelected]}>
                  {t.name.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        <Text style={styles.footerVersion}>ReelCount v0.3.0</Text>
        <Text style={styles.footerTagline}>Mindful Digital Wellbeing Sanctuary</Text>
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

        {/* Craving SOS & Impulse Interrupter Sanctuary Modal */}
        <Modal
          visible={showCravingModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowCravingModal(false);
            setDelayRunning(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.breatheModalCard}>
              <Text style={styles.breatheModalEyebrow}>NEURAL PATTERN INTERRUPT</Text>
              <Text style={styles.breatheModalTitle}>Craving SOS Sanctuary</Text>
              <Text style={styles.breatheModalDesc}>
                Break the dopamine compulsion loop with an evidence-based mindful pause.
              </Text>

              {/* 4-Mode Switcher */}
              <View style={styles.modalTabRow}>
                <Pressable
                  onPress={() => setCravingTab('breathing')}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'breathing' && styles.modalTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'breathing' && styles.modalTabBtnTextActive,
                    ]}
                  >
                    🧘 Breath
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCravingTab('delay')}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'delay' && styles.modalTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'delay' && styles.modalTabBtnTextActive,
                    ]}
                  >
                    🌊 90s Delay
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCravingTab('grounding')}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'grounding' && styles.modalTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'grounding' && styles.modalTabBtnTextActive,
                    ]}
                  >
                    🌿 Grounding
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    resetStroop();
                    setCravingTab('stroop');
                  }}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'stroop' && styles.modalTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'stroop' && styles.modalTabBtnTextActive,
                    ]}
                  >
                    🧠 Stroop
                  </Text>
                </Pressable>
              </View>

              {/* Mode 1: 4-4-4 Box Breathing */}
              {cravingTab === 'breathing' && (
                <View style={styles.cravingContentWrap}>
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
                    {breatheSecondsRemaining}s session remaining
                  </Text>
                </View>
              )}

              {/* Mode 2: 90-Second Craving Surge Delay */}
              {cravingTab === 'delay' && (
                <View style={styles.cravingContentWrap}>
                  <View style={styles.delayVisualWrap}>
                    <View style={styles.delayTimerCircle}>
                      <Text style={styles.delaySecondsText}>{delaySeconds}s</Text>
                      <Text style={styles.delaySublabel}>Craving Surge</Text>
                    </View>
                  </View>
                  <Text style={styles.delayStageText}>
                    {delaySeconds > 60
                      ? '🌊 Urge Rising: Observe the itch without judgment.'
                      : delaySeconds > 30
                      ? '⚡ Wave Cresting: The dopamine spike is leveling off.'
                      : '🌿 Wave Subsiding: Impulse fading, prefrontal cortex in control.'}
                  </Text>
                  <View style={styles.delayActionBtnRow}>
                    <Pressable
                      onPress={() => setDelayRunning(prev => !prev)}
                      style={[styles.delayActionBtn, delayRunning && styles.delayActionBtnActive]}
                    >
                      <Text style={styles.delayActionBtnText}>
                        {delayRunning ? '⏸️ Pause Timer' : '▶️ Surf the Wave (90s)'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setDelayRunning(false);
                        setDelaySeconds(90);
                      }}
                      style={styles.delayResetBtn}
                    >
                      <Text style={styles.delayResetBtnText}>Reset</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Mode 3: 5-4-3-2-1 Sensory Grounding */}
              {cravingTab === 'grounding' && (
                <View style={styles.cravingContentWrap}>
                  <View style={styles.groundingCard}>
                    <View style={styles.groundingBadgeRow}>
                      <Text style={styles.groundingSenseTag}>
                        {groundingSteps[groundingStep].sense}
                      </Text>
                      <Text style={styles.groundingStepCount}>
                        Step {groundingStep + 1} of 5
                      </Text>
                    </View>
                    <Text style={styles.groundingTitle}>
                      {groundingSteps[groundingStep].title}
                    </Text>
                    <Text style={styles.groundingPrompt}>
                      {groundingSteps[groundingStep].prompt}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      if (groundingStep < groundingSteps.length - 1) {
                        setGroundingStep(prev => prev + 1);
                      } else {
                        setGroundingStep(0);
                        setShowCravingModal(false);
                        Alert.alert('Grounding Complete 🌿', 'Your senses are anchored and mind is clear.');
                      }
                    }}
                    style={styles.groundingNextBtn}
                  >
                    <Text style={styles.groundingNextBtnText}>
                      {groundingStep < 4 ? 'Next Sensory Anchor →' : 'Complete Grounding Session ✓'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Mode 4: Stroop Cognitive Conflict Test */}
              {cravingTab === 'stroop' && (
                <View style={styles.stroopContainer}>
                  {!stroopFinished ? (
                    <>
                      <Text style={styles.stroopRoundEyebrow}>
                        CHALLENGE {stroopRound + 1} OF 3
                      </Text>
                      <Text style={styles.stroopInstruction}>
                        Tap the <Text style={styles.stroopHighlight}>INK COLOR</Text> of the word below (ignore the letters):
                      </Text>

                      {/* Conflict Word Card */}
                      <View style={styles.stroopWordCard}>
                        <Text
                          style={[
                            styles.stroopWordText,
                            { color: STROOP_TRIALS[stroopRound % STROOP_TRIALS.length].color },
                          ]}
                        >
                          {STROOP_TRIALS[stroopRound % STROOP_TRIALS.length].text}
                        </Text>
                      </View>

                      {stroopFeedback && (
                        <Text style={styles.stroopFeedbackText}>{stroopFeedback}</Text>
                      )}

                      {/* 4 Ink Color Buttons */}
                      <View style={styles.stroopButtonsGrid}>
                        {['Emerald', 'Cyan', 'Amethyst', 'Amber'].map(cName => {
                          const colorMap: Record<string, string> = {
                            Emerald: '#38d39f',
                            Cyan: '#22d3ee',
                            Amethyst: '#c084fc',
                            Amber: '#fbbf24',
                          };
                          return (
                            <Pressable
                              key={cName}
                              onPress={() => handleStroopAnswer(cName)}
                              style={[
                                styles.stroopChoiceBtn,
                                { borderColor: colorMap[cName] },
                              ]}
                            >
                              <View
                                style={[
                                  styles.stroopColorSwatch,
                                  { backgroundColor: colorMap[cName] },
                                ]}
                              />
                              <Text style={styles.stroopChoiceText}>{cName}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <View style={styles.stroopSuccessCard}>
                      <Text style={styles.stroopSuccessIcon}>🧠✨</Text>
                      <Text style={styles.stroopSuccessTitle}>Prefrontal Cortex Restored!</Text>
                      <Text style={styles.stroopSuccessDesc}>
                        The color-word conflict forced your executive brain to override the basal-ganglia autonomic dopamine loop.
                      </Text>
                      <View style={styles.stroopXpBadge}>
                        <Text style={styles.stroopXpBadgeText}>+40 Zen XP Earned</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          resetStroop();
                          setShowCravingModal(false);
                        }}
                        style={styles.stroopCompleteBtn}
                      >
                        <Text style={styles.stroopCompleteBtnText}>Conscious Awareness Restored ✓</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              <Pressable
                onPress={() => {
                  setShowCravingModal(false);
                  setDelayRunning(false);
                  setBreatheSecondsRemaining(60);
                  setBreathePhase('Inhale');
                }}
                style={styles.breatheCloseBtn}
              >
                <Text style={styles.breatheCloseBtnText}>Return to Sanctuary</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  soundscapeDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  soundscapeDurationLabel: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  soundscapeDurationBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#111d17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  soundscapeDurationBtnActive: {
    borderColor: '#38d39f',
    backgroundColor: '#15281f',
  },
  soundscapeDurationBtnText: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
  },
  soundscapeDurationBtnTextActive: {
    color: '#38d39f',
    fontWeight: '800',
  },
  soundscapePlayToggleBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38d39f',
  },
  soundscapePlayToggleText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '800',
  },


  // Attention Mastery & XP Styles
  masteryCard: {
    backgroundColor: '#0c1511',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.3)',
  },
  masteryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  masteryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masteryLevelIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  masteryEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  masteryTitle: {
    color: '#f1f5f3',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  masteryXpPill: {
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38d39f',
  },
  masteryXpText: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '900',
  },
  masteryProgressTrack: {
    height: 8,
    backgroundColor: '#1b2821',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  masteryProgressFill: {
    height: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 4,
  },
  masteryProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  masteryProgressSub: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '600',
  },
  masteryProgressNext: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },
  questsHeader: {
    color: '#657e71',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  questsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questItem: {
    width: '48%',
    backgroundColor: '#111d17',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  questItemDone: {
    borderColor: 'rgba(56, 211, 159, 0.4)',
    backgroundColor: '#102219',
  },
  questIcon: {
    fontSize: 16,
    color: '#38d39f',
    marginRight: 8,
    fontWeight: '900',
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    color: '#e2e8e5',
    fontSize: 12,
    fontWeight: '700',
  },
  questReward: {
    color: '#8aa395',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },

  // Intercept Card Styles
  interceptCard: {
    backgroundColor: '#111728',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  interceptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  interceptEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  interceptTitleCol: {
    flex: 1,
  },
  interceptEyebrow: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  interceptTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  interceptDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  interceptActionBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  interceptActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // 24-Hour Dopamine Clock Styles
  clockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardSectionEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  liveNowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111d17',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.4)',
  },
  liveNowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38d39f',
    marginRight: 6,
  },
  liveNowText: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '700',
  },
  hourlyBarRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
  },
  hourlyBarItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#111d17',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 44,
  },
  hourlyBarItemSelected: {
    borderColor: '#38d39f',
    backgroundColor: '#15251e',
  },
  hourlyBarItemCurrent: {
    borderWidth: 2,
  },
  hourlyBarHourText: {
    color: '#657e71',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  hourlyBarTextActive: {
    color: '#f1f5f3',
  },
  hourlyBarIndicator: {
    width: 14,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  hourlyBarEmoji: {
    fontSize: 12,
  },
  hourInsightBox: {
    backgroundColor: '#0c1511',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  hourInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hourInsightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  hourInsightTitleCol: {
    flex: 1,
  },
  hourInsightTimeRange: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '800',
  },
  hourInsightRisk: {
    fontSize: 11,
    fontWeight: '700',
  },
  hourInsightPeriodTitle: {
    color: '#d1fae5',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  hourInsightTip: {
    color: '#8aa395',
    fontSize: 12,
    lineHeight: 17,
  },

  // Impulse Awareness Journal Styles
  triggerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  triggerXpHint: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '800',
  },
  triggerSubText: {
    color: '#8aa395',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  triggerPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  triggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111d17',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  triggerPillSelected: {
    borderColor: '#38d39f',
    backgroundColor: '#15281f',
  },
  triggerPillIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  triggerPillLabel: {
    color: '#8aa395',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  triggerPillLabelSelected: {
    color: '#f1f5f3',
  },
  triggerCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  triggerCountBadgeText: {
    color: '#657e71',
    fontSize: 10,
    fontWeight: '800',
  },
  triggerAdviceCard: {
    backgroundColor: '#0c1511',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.25)',
  },
  triggerAdviceEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  triggerAdviceBody: {
    color: '#d1fae5',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  // Stroop Modal Game Styles
  stroopContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  stroopRoundEyebrow: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  stroopInstruction: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  stroopHighlight: {
    color: '#22d3ee',
    fontWeight: '900',
  },
  stroopWordCard: {
    width: '100%',
    backgroundColor: '#090e0c',
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  stroopWordText: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  stroopFeedbackText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  stroopButtonsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  stroopChoiceBtn: {
    width: '48%',
    backgroundColor: '#111d17',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  stroopColorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  stroopChoiceText: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '800',
  },
  stroopSuccessCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  stroopSuccessIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  stroopSuccessTitle: {
    color: '#f1f5f3',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
  },
  stroopSuccessDesc: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  stroopXpBadge: {
    backgroundColor: 'rgba(56, 211, 159, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38d39f',
    marginBottom: 16,
  },
  stroopXpBadgeText: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '900',
  },
  stroopCompleteBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  stroopCompleteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

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

  // Craving SOS Banner Styles
  cravingSosBanner: {
    backgroundColor: '#0c1d15',
    borderColor: 'rgba(56, 211, 159, 0.4)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cravingSosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cravingSosBadge: {
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
    borderColor: '#38d39f',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cravingSosBadgeText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cravingSosWaveTag: {
    color: '#7a9e8b',
    fontSize: 12,
    fontWeight: '600',
  },
  cravingSosTitle: {
    color: '#f1f5f3',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  cravingSosDesc: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  cravingSosBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cravingSosPrimaryBtn: {
    flex: 1.2,
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cravingSosPrimaryBtnText: {
    color: '#090e0c',
    fontSize: 13,
    fontWeight: '800',
  },
  cravingSosSecondaryBtn: {
    flex: 1,
    backgroundColor: '#16281f',
    borderColor: 'rgba(56, 211, 159, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cravingSosSecondaryBtnText: {
    color: '#c2d4cb',
    fontSize: 12,
    fontWeight: '700',
  },

  // Life Reclaimed Equivalents Grid
  lifeReclaimedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  lifeReclaimedCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#0d1813',
    borderColor: 'rgba(56, 211, 159, 0.12)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  lifeReclaimedIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  lifeReclaimedValue: {
    color: '#38d39f',
    fontSize: 16,
    fontWeight: '800',
  },
  lifeReclaimedLabel: {
    color: '#7a9e8b',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // Chrono-Shield Styles
  chronoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chronoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  chronoTitleWrap: {
    flex: 1,
  },
  chronoBadgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  chronoLevelBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chronoTitle: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '800',
  },
  chronoAdviceText: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 18,
  },

  // Milestones & Badges
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  milestoneBadgeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  milestoneUnlocked: {
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
    borderColor: 'rgba(56, 211, 159, 0.35)',
  },
  milestoneLocked: {
    backgroundColor: '#0e1613',
    borderColor: '#1e2d25',
    opacity: 0.6,
  },
  milestoneIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  milestoneName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  milestoneNameUnlocked: {
    color: '#f1f5f3',
  },
  milestoneNameLocked: {
    color: '#7a9e8b',
  },
  milestoneDesc: {
    color: '#6e8579',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  milestoneStatusTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  milestoneStatusTagUnlocked: {
    backgroundColor: 'rgba(56, 211, 159, 0.2)',
  },
  milestoneStatusTagLocked: {
    backgroundColor: '#1b2821',
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  milestoneStatusTextUnlocked: {
    color: '#38d39f',
  },
  milestoneStatusTextLocked: {
    color: '#6e8579',
  },

  // HUD Style Selector
  hudStyleSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  hudStyleCard: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  hudStyleCardSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.1)',
  },
  hudStyleIcon: {
    fontSize: 15,
    color: '#38d39f',
    fontWeight: '800',
    marginBottom: 4,
  },
  hudStyleLabel: {
    color: '#9cb1a6',
    fontSize: 12,
    fontWeight: '700',
  },
  hudStyleLabelSelected: {
    color: '#f1f5f3',
  },
  hudStyleDesc: {
    color: '#6e8579',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },

  // Craving Modal Switcher & Tools
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#090e0c',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    width: '100%',
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalTabBtnActive: {
    backgroundColor: '#1b2d24',
  },
  modalTabBtnText: {
    color: '#6e8579',
    fontSize: 12,
    fontWeight: '700',
  },
  modalTabBtnTextActive: {
    color: '#38d39f',
  },
  cravingContentWrap: {
    width: '100%',
    alignItems: 'center',
  },
  delayVisualWrap: {
    marginVertical: 16,
    alignItems: 'center',
  },
  delayTimerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delaySecondsText: {
    color: '#f1f5f3',
    fontSize: 36,
    fontWeight: '900',
  },
  delaySublabel: {
    color: '#7a9e8b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  delayStageText: {
    color: '#c2d4cb',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  delayActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  delayActionBtn: {
    flex: 1,
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  delayActionBtnActive: {
    backgroundColor: '#eab308',
  },
  delayActionBtnText: {
    color: '#090e0c',
    fontSize: 14,
    fontWeight: '800',
  },
  delayResetBtn: {
    backgroundColor: '#16281f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263d30',
  },
  delayResetBtnText: {
    color: '#9cb1a6',
    fontSize: 13,
    fontWeight: '700',
  },
  groundingCard: {
    width: '100%',
    backgroundColor: '#0d1813',
    borderColor: 'rgba(56, 211, 159, 0.25)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginVertical: 14,
  },
  groundingBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groundingSenseTag: {
    backgroundColor: 'rgba(56, 211, 159, 0.2)',
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groundingStepCount: {
    color: '#6e8579',
    fontSize: 12,
    fontWeight: '700',
  },
  groundingTitle: {
    color: '#f1f5f3',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  groundingPrompt: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 19,
  },
  groundingNextBtn: {
    width: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  groundingNextBtnText: {
    color: '#090e0c',
    fontSize: 14,
    fontWeight: '800',
  },

  // Daily Intention Anchor
  intentionCard: {
    backgroundColor: '#0c1a14',
    borderColor: 'rgba(56, 211, 159, 0.25)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  intentionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  intentionEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  intentionTag: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '600',
  },
  intentionText: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  intentionPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  intentionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12221b',
    borderColor: '#23382d',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  intentionPillSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
  },
  intentionPillIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  intentionPillText: {
    color: '#8aa395',
    fontSize: 12,
    fontWeight: '700',
  },
  intentionPillTextSelected: {
    color: '#38d39f',
  },

  // Digital Wellbeing Vitality Score
  vitalityCard: {
    backgroundColor: '#0f2319',
    borderColor: 'rgba(56, 211, 159, 0.35)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vitalityLeftCol: {
    flex: 1,
  },
  vitalityEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  vitalityScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  vitalityScoreNum: {
    color: '#f1f5f3',
    fontSize: 32,
    fontWeight: '900',
  },
  vitalityScoreMax: {
    color: '#6e8579',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
  vitalityStatusText: {
    color: '#9cb1a6',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  vitalityRingWrap: {
    marginLeft: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalityMiniRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalityRingHigh: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
  },
  vitalityRingMed: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  vitalityRingLow: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  vitalityRingIcon: {
    fontSize: 22,
  },

  // Daily Mood Check-In
  moodGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  moodCardSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  moodIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: '#38d39f',
  },
  moodTipBox: {
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38d39f',
  },
  moodTipText: {
    color: '#c2d4cb',
    fontSize: 12,
    lineHeight: 16,
  },

  // 24-Hour Sabbath
  sabbathCardActive: {
    borderColor: 'rgba(248, 113, 113, 0.4)',
    backgroundColor: '#1a0f12',
  },
  sabbathBtn: {
    backgroundColor: '#1b2d24',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2b473a',
  },
  sabbathBtnActive: {
    backgroundColor: '#7f1d1d',
    borderColor: '#f87171',
  },
  sabbathBtnText: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '800',
  },
  sabbathBtnTextActive: {
    color: '#fee2e2',
  },

  // Focus Soundscapes
  soundscapeToggleBtn: {
    backgroundColor: '#1a2c22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2d4a3b',
  },
  soundscapeToggleBtnText: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '700',
  },
  soundscapeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  soundscapeCard: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  soundscapeCardActive: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  soundscapeIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  soundscapeName: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  soundscapeNameActive: {
    color: '#38d39f',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#0a1410',
    borderRadius: 10,
  },
  eqBar: {
    width: 4,
    backgroundColor: '#38d39f',
    borderRadius: 2,
    marginRight: 4,
  },
  eqBar1: { height: 14 },
  eqBar2: { height: 22 },
  eqBar3: { height: 18 },
  eqBar4: { height: 12 },
  eqLabel: {
    color: '#7a9e8b',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },

  // Theme Palette
  themePaletteRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeChip: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  themeChipSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  themeChipIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  themeChipName: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
  },
  themeChipNameSelected: {
    color: '#f1f5f3',
  },
});

export default App;
