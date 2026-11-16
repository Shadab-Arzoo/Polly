package com.reelcount

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.reelcount.tracking.PrototypeRuntimeStatus
import com.reelcount.tracking.ReelCountAccessibilityService
import com.reelcount.tracking.ReelCountPreferences
import com.reelcount.tracking.TargetPackages

class PrototypeSettingsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PrototypeSettings"

  private val prefs: ReelCountPreferences by lazy {
    ReelCountPreferences.getInstance(reactApplicationContext)
  }

  @ReactMethod
  fun getPrototypeStatus(promise: Promise) {
    val status = PrototypeRuntimeStatus.snapshot(prefs)
    val isConnected = status.serviceConnected || isAccessibilityServiceEnabled()
    val isFocusActive = prefs.isFocusModeActive()
    val focusRemainingSec = prefs.getFocusRemainingSeconds()

    val instaCount = prefs.getTodayPackageCount(TargetPackages.INSTAGRAM) +
      prefs.getTodayPackageCount(TargetPackages.INSTAGRAM_LITE)
    val tiktokCount = prefs.getTodayPackageCount(TargetPackages.TIKTOK) +
      prefs.getTodayPackageCount(TargetPackages.TIKTOK_TRILL) +
      prefs.getTodayPackageCount(TargetPackages.TIKTOK_LITE)
    val ytCount = prefs.getTodayPackageCount(TargetPackages.YOUTUBE)
    val snapCount = prefs.getTodayPackageCount(TargetPackages.SNAPCHAT)

    val result = Arguments.createMap().apply {
      putBoolean("serviceConnected", isConnected)
      putInt("candidateCount", status.candidateCount)
      putInt("bufferedEventCount", status.bufferedEventCount)
      putInt("instagramCount", instaCount)
      putInt("tiktokCount", tiktokCount)
      putInt("youtubeCount", ytCount)
      putInt("snapchatCount", snapCount)
      putBoolean("focusModeActive", isFocusActive)
      putInt("focusRemainingSeconds", focusRemainingSec.toInt())
      putInt("dailyShortLimit", prefs.getDailyShortLimit())
      putInt("dailyTimeLimitMinutes", prefs.getDailyTimeLimitMinutes())
      putBoolean("onboardingCompleted", prefs.isOnboardingCompleted())
      putString("hudStyle", prefs.getHudStyle())
      putBoolean("bedtimeShieldEnabled", prefs.isBedtimeShieldEnabled())
      putBoolean("bedtimeShieldActive", prefs.isBedtimeShieldActive())
      putBoolean("doomscrollAlertEnabled", prefs.isDoomscrollAlertEnabled())
      putBoolean("breakReminderEnabled", prefs.isBreakReminderEnabled())
      putBoolean("speedbumpEnabled", prefs.isSpeedbumpEnabled())
      putInt("zenXp", prefs.getZenXp())
      putString("userIntention", prefs.getUserIntention())
      putString("userMood", prefs.getUserMood() ?: "")
      putInt("triggerBoredom", prefs.getTriggerCount("boredom"))
      putInt("triggerStress", prefs.getTriggerCount("stress"))
      putInt("triggerProcrastination", prefs.getTriggerCount("procrastination"))
      putInt("triggerHabit", prefs.getTriggerCount("habit"))
      putInt("triggerFomo", prefs.getTriggerCount("fomo"))
      putInt("instagramLimit", prefs.getPackageLimit(TargetPackages.INSTAGRAM))
      putInt("tiktokLimit", prefs.getPackageLimit(TargetPackages.TIKTOK))
      putInt("youtubeLimit", prefs.getPackageLimit(TargetPackages.YOUTUBE))
      putInt("snapchatLimit", prefs.getPackageLimit(TargetPackages.SNAPCHAT))
      putString("themeAccent", prefs.getThemeAccent())
    }
    promise.resolve(result)
  }

  @ReactMethod
  fun setOnboardingCompleted(completed: Boolean, promise: Promise) {
    try {
      prefs.setOnboardingCompleted(completed)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ONBOARDING_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setFocusMode(active: Boolean, durationMinutes: Int, blockedPackages: ReadableArray, promise: Promise) {
    try {
      val pkgSet = mutableSetOf<String>()
      for (i in 0 until blockedPackages.size()) {
        val pkg = blockedPackages.getString(i)
        if (!pkg.isNullOrEmpty()) {
          pkgSet.add(pkg)
          // Also block lite & regional variants
          when (pkg) {
            TargetPackages.INSTAGRAM -> pkgSet.add(TargetPackages.INSTAGRAM_LITE)
            TargetPackages.TIKTOK -> {
              pkgSet.add(TargetPackages.TIKTOK_TRILL)
              pkgSet.add(TargetPackages.TIKTOK_LITE)
            }
          }
        }
      }
      prefs.setFocusMode(active, durationMinutes, pkgSet)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("FOCUS_MODE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setDailyLimits(shortLimit: Int, timeLimitMinutes: Int, promise: Promise) {
    try {
      prefs.setDailyLimits(shortLimit, timeLimitMinutes)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("LIMIT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setHudStyle(style: String, promise: Promise) {
    try {
      prefs.setHudStyle(style)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("HUD_STYLE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setBedtimeShield(enabled: Boolean, startHour: Int, endHour: Int, promise: Promise) {
    try {
      prefs.setBedtimeShield(enabled, startHour, endHour)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("BEDTIME_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setDoomscrollAlert(enabled: Boolean, promise: Promise) {
    try {
      prefs.setDoomscrollAlertEnabled(enabled)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("DOOMSCROLL_ALERT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setBreakReminder(enabled: Boolean, promise: Promise) {
    try {
      prefs.setBreakReminderEnabled(enabled)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("BREAK_REMINDER_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun playSoundscape(soundscape: String, durationMinutes: Int, promise: Promise) {
    try {
      com.reelcount.soundscape.ProceduralSoundscapePlayer.play(soundscape)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SOUNDSCAPE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopSoundscape(promise: Promise) {
    try {
      com.reelcount.soundscape.ProceduralSoundscapePlayer.stop()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SOUNDSCAPE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun isSoundscapePlaying(promise: Promise) {
    try {
      promise.resolve(com.reelcount.soundscape.ProceduralSoundscapePlayer.isAudioPlaying())
    } catch (e: Exception) {
      promise.reject("SOUNDSCAPE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setSpeedbumpEnabled(enabled: Boolean, promise: Promise) {
    try {
      prefs.setSpeedbumpEnabled(enabled)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SPEEDBUMP_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setPackageLimit(packageName: String, limit: Int, promise: Promise) {
    try {
      prefs.setPackageLimit(packageName, limit)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PACKAGE_LIMIT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun addZenXp(amount: Int, promise: Promise) {
    try {
      val newXp = prefs.addZenXp(amount)
      promise.resolve(newXp)
    } catch (e: Exception) {
      promise.reject("ZEN_XP_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun logTrigger(trigger: String, promise: Promise) {
    try {
      prefs.logTrigger(trigger)
      promise.resolve(prefs.getTriggerCount(trigger))
    } catch (e: Exception) {
      promise.reject("TRIGGER_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setUserIntention(intention: String, promise: Promise) {
    try {
      prefs.setUserIntention(intention)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("INTENTION_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setUserMood(mood: String, promise: Promise) {
    try {
      prefs.setUserMood(mood)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("MOOD_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getDailyHistory(promise: Promise) {
    try {
      val history = prefs.get7DayHistory()
      val list = Arguments.createArray()
      for (item in history) {
        val map = Arguments.createMap().apply {
          putString("date", item.date)
          putString("label", item.label)
          putInt("count", item.count)
        }
        list.pushMap(map)
      }
      promise.resolve(list)
    } catch (e: Exception) {
      promise.reject("HISTORY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun resetCounters(promise: Promise) {
    PrototypeRuntimeStatus.reset(prefs)
    promise.resolve(null)
  }

  @ReactMethod
  fun setThemeAccent(theme: String, promise: Promise) {
    try {
      prefs.setThemeAccent(theme)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("THEME_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SETTINGS_UNAVAILABLE", "Unable to open Android accessibility settings", error)
    }
  }

  private fun isAccessibilityServiceEnabled(): Boolean {
    val context = reactApplicationContext
    val expectedFull = "${context.packageName}/${ReelCountAccessibilityService::class.java.name}"
    val expectedShort = "${context.packageName}/.tracking.ReelCountAccessibilityService"

    try {
      val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
      if (am != null) {
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        for (service in enabledServices) {
          val info = service.resolveInfo?.serviceInfo
          if (info != null && info.packageName == context.packageName &&
            (info.name == ReelCountAccessibilityService::class.java.name || info.name.endsWith("ReelCountAccessibilityService"))) {
            return true
          }
        }
      }
    } catch (_: Exception) {}

    try {
      val settingValue = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: return false
      val splitter = TextUtils.SimpleStringSplitter(':')
      splitter.setString(settingValue)
      while (splitter.hasNext()) {
        val component = splitter.next()
        if (component.equals(expectedFull, ignoreCase = true) ||
          component.equals(expectedShort, ignoreCase = true) ||
          component.contains("ReelCountAccessibilityService", ignoreCase = true)) {
          return true
        }
      }
    } catch (_: Exception) {}

    return false
  }
}