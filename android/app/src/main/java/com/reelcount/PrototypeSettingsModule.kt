package com.reelcount

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.reelcount.tracking.PrototypeRuntimeStatus

class PrototypeSettingsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PrototypeSettings"

  @ReactMethod
  fun getPrototypeStatus(promise: Promise) {
    val status = PrototypeRuntimeStatus.snapshot()
    val result = Arguments.createMap().apply {
      putBoolean("serviceConnected", status.serviceConnected)
      putInt("candidateCount", status.candidateCount)
      putInt("bufferedEventCount", status.bufferedEventCount)
    }
    promise.resolve(result)
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
}
