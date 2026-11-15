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
import com.reelcount.tracking.PrototypeRuntimeStatus
import com.reelcount.tracking.ReelCountAccessibilityService
import com.reelcount.tracking.TargetPackages

class PrototypeSettingsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PrototypeSettings"

  @ReactMethod
  fun getPrototypeStatus(promise: Promise) {
    val status = PrototypeRuntimeStatus.snapshot()
    val isConnected = status.serviceConnected || isAccessibilityServiceEnabled()
    val result = Arguments.createMap().apply {
      putBoolean("serviceConnected", isConnected)
      putInt("candidateCount", status.candidateCount)
      putInt("bufferedEventCount", status.bufferedEventCount)
      putInt("instagramCount", status.packageCounts[TargetPackages.INSTAGRAM] ?: 0)
      putInt("tiktokCount", status.packageCounts[TargetPackages.TIKTOK] ?: 0)
      putInt("youtubeCount", status.packageCounts[TargetPackages.YOUTUBE] ?: 0)
      putInt("snapchatCount", status.packageCounts[TargetPackages.SNAPCHAT] ?: 0)
    }
    promise.resolve(result)
  }

  @ReactMethod
  fun resetCounters(promise: Promise) {
    PrototypeRuntimeStatus.reset()
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
