package com.reelcount.tracking

import android.accessibilityservice.AccessibilityService
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast
import java.util.ArrayDeque

/**
 * Event-only tracking and enforcement Accessibility Service.
 *
 * Implements:
 * 1. Focus Mode Enforcement: Instantly exits and blocks target apps during active focus sessions.
 * 2. Real-time short video scroll tracking & live floating overlay HUD updates.
 * 3. Daily limit monitoring, push notifications, and warning alerts.
 * 4. Subtle haptic feedback on each detected short-video swipe.
 * 5. Persistent count tracking via ReelCountPreferences.
 */
class ReelCountAccessibilityService : AccessibilityService() {
  private val trace = ArrayDeque<EventMetadata>(MAX_TRACE_EVENTS)
  private val reducer = CandidateTransitionReducer()
  private val handler = Handler(Looper.getMainLooper())
  private val clearIdleState = Runnable { clearIdleTrace() }

  private var overlayHud: ReelCountOverlayHud? = null
  private var currentActivePackage: String? = null
  private var lastNotifiedPackage: String? = null
  private var lastNotificationTime: Long = 0L
  private var lastLimitAlertTime: Long = 0L
  private var lastBlockedToastTime: Long = 0L

  private lateinit var prefs: ReelCountPreferences
  private var notificationManager: NotificationManager? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    prefs = ReelCountPreferences.getInstance(this)
    notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    createNotificationChannels()
    PrototypeRuntimeStatus.connected(prefs)

    if (overlayHud == null) {
      overlayHud = ReelCountOverlayHud(this)
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    val packageName = event.packageName?.toString() ?: return

    if (!::prefs.isInitialized) {
      prefs = ReelCountPreferences.getInstance(this)
    }

    val appLabel = when (packageName) {
      TargetPackages.INSTAGRAM -> "Instagram Reels"
      TargetPackages.TIKTOK -> "TikTok"
      TargetPackages.YOUTUBE -> "YouTube Shorts"
      TargetPackages.SNAPCHAT -> "Snapchat Spotlight"
      else -> "Shorts"
    }

    val now = System.currentTimeMillis()

    // 1. FOCUS MODE ENFORCEMENT & APP BLOCKING
    if (prefs.isPackageBlocked(packageName)) {
      overlayHud?.hide()
      currentActivePackage = null

      // Kick user back to the home screen
      performGlobalAction(GLOBAL_ACTION_HOME)

      if (now - lastBlockedToastTime > 3_000L) {
        lastBlockedToastTime = now
        val remainingMin = (prefs.getFocusRemainingSeconds() / 60) + 1
        handler.post {
          Toast.makeText(
            applicationContext,
            "🔒 ReelCount Focus Mode Active\n$appLabel is blocked ($remainingMin min remaining)",
            Toast.LENGTH_LONG
          ).show()
        }
        triggerWarningVibration()
      }
      return
    }

    // 2. TARGET APP MONITORING
    if (packageName !in TargetPackages.all) {
      if (currentActivePackage != null && packageName != applicationContext.packageName) {
        currentActivePackage = null
        overlayHud?.hide()
      }
      return
    }

    val isAppSwitch = currentActivePackage != packageName
    currentActivePackage = packageName

    // Notify when opening a short-video app
    if (isAppSwitch && (lastNotifiedPackage != packageName || now - lastNotificationTime > 15_000L)) {
      lastNotifiedPackage = packageName
      lastNotificationTime = now
      val count = PrototypeRuntimeStatus.getPackageCount(packageName, prefs)
      val dailyLimit = prefs.getDailyShortLimit()
      val isLimitHit = prefs.getTodayCount() >= dailyLimit

      handler.post {
        Toast.makeText(
          applicationContext,
          "🎬 ReelCount: $appLabel opened · Counter active",
          Toast.LENGTH_SHORT
        ).show()
      }
      overlayHud?.show(appLabel, count, isLimitHit)
    }

    // 3. CANDIDATE SCROLL DETECTION
    val metadata = EventMetadata(event.eventType, packageName, event.eventTime)
    if (trace.size == MAX_TRACE_EVENTS) trace.removeFirst()
    trace.addLast(metadata)

    val candidate = reducer.reduce(metadata)
    PrototypeRuntimeStatus.recordEvent(candidate, trace.size, packageName, prefs)

    if (candidate) {
      val currentPkgCount = PrototypeRuntimeStatus.getPackageCount(packageName, prefs)
      val todayTotal = prefs.getTodayCount()
      val dailyLimit = prefs.getDailyShortLimit()
      val isLimitHit = todayTotal >= dailyLimit

      // Update HUD overlay
      overlayHud?.updateCount(appLabel, currentPkgCount, isLimitHit)

      // Haptic & Notification alert when daily limit is crossed
      if (isLimitHit) {
        if (todayTotal == dailyLimit || (now - lastLimitAlertTime > 180_000L)) {
          lastLimitAlertTime = now
          sendLimitReachedNotification(todayTotal, dailyLimit)
          triggerWarningVibration()
        } else {
          triggerTickVibration()
        }
      } else {
        triggerTickVibration()
      }
    }

    handler.removeCallbacks(clearIdleState)
    handler.postDelayed(clearIdleState, TRACE_IDLE_TIMEOUT_MS)
  }

  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "ReelCount Alerts",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Daily limits and Focus Mode reminders"
        enableVibration(true)
      }
      notificationManager?.createNotificationChannel(channel)
    }
  }

  private fun sendLimitReachedNotification(total: Int, limit: Int) {
    val nm = notificationManager ?: return
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val builder = android.app.Notification.Builder(this, CHANNEL_ID)
          .setContentTitle("⚠️ ReelCount: Daily Limit Reached")
          .setContentText("You've watched $total shorts today (Limit: $limit). Time to take a break!")
          .setSmallIcon(android.R.drawable.ic_dialog_alert)
          .setAutoCancel(true)

        nm.notify(NOTIFICATION_LIMIT_ID, builder.build())
      }
    } catch (_: Exception) {}
  }

  private fun triggerTickVibration() {
    try {
      val vibrator = getVibrator() ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createOneShot(18, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(18)
      }
    } catch (_: Exception) {}
  }

  private fun triggerWarningVibration() {
    try {
      val vibrator = getVibrator() ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val pattern = longArrayOf(0, 150, 100, 250)
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(longArrayOf(0, 150, 100, 250), -1)
      }
    } catch (_: Exception) {}
  }

  private fun getVibrator(): Vibrator? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
      vm?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }

  override fun onInterrupt() {
    handler.removeCallbacks(clearIdleState)
    trace.clear()
    reducer.reset()
    PrototypeRuntimeStatus.interrupted()
    overlayHud?.hide()
  }

  override fun onUnbind(intent: android.content.Intent?): Boolean {
    clearTransientState()
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    clearTransientState()
    overlayHud?.destroy()
    overlayHud = null
    super.onDestroy()
  }

  private fun clearTransientState() {
    handler.removeCallbacks(clearIdleState)
    trace.clear()
    reducer.reset()
    PrototypeRuntimeStatus.disconnected()
    overlayHud?.hide()
    currentActivePackage = null
  }

  private fun clearIdleTrace() {
    trace.clear()
    PrototypeRuntimeStatus.clearTrace()
  }

  private companion object {
    const val MAX_TRACE_EVENTS = 32
    const val TRACE_IDLE_TIMEOUT_MS = 2_000L
    const val CHANNEL_ID = "reelcount_alerts"
    const val NOTIFICATION_LIMIT_ID = 1001
  }
}
