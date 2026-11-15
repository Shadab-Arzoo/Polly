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

    val result = Arguments.createMap().apply {
      putBoolean("serviceConnected", isConnected)
      putInt("candidateCount", status.candidateCount)
      putInt("bufferedEventCount", status.bufferedEventCount)
      putInt("instagramCount", prefs.getTodayPackageCount(TargetPackages.INSTAGRAM))
      putInt("tiktokCount", prefs.getTodayPackageCount(TargetPackages.TIKTOK))
      putInt("youtubeCount", prefs.getTodayPackageCount(TargetPackages.YOUTUBE))
      putInt("snapchatCount", prefs.getTodayPackageCount(TargetPackages.SNAPCHAT))
      putBoolean("focusModeActive", isFocusActive)
      putInt("focusRemainingSeconds", focusRemainingSec.toInt())
      putInt("dailyShortLimit", prefs.getDailyShortLimit())
      putInt("dailyTimeLimitMinutes", prefs.getDailyTimeLimitMinutes())
      putBoolean("onboardingCompleted", prefs.isOnboardingCompleted())
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
