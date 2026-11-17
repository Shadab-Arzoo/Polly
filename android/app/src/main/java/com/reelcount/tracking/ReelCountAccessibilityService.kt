package com.reelcount.tracking

import android.accessibilityservice.AccessibilityService
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
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
 * 2. Bedtime Sleep Shield: Automatically blocks short-form feeds during night hours (11 PM - 6 AM).
 * 3. Real-time short video scroll tracking & live floating overlay HUD updates.
 * 4. Doomscroll Vortex Nudge: Warns users after 15 consecutive shorts to break compulsive loops.
 * 5. Daily limit monitoring, interactive push notifications, and warning alerts.
 * 6. Subtle haptic feedback on each detected short-video swipe.
 * 7. Persistent count tracking via ReelCountPreferences.
 */
class ReelCountAccessibilityService : AccessibilityService() {
  private val trace = ArrayDeque<EventMetadata>(MAX_TRACE_EVENTS)
  private val reducer = CandidateTransitionReducer()
  private val detector = ShortVideoDetector()
  private val handler = Handler(Looper.getMainLooper())
  private val clearIdleState = Runnable { clearIdleTrace() }

  private var overlayHud: ReelCountOverlayHud? = null
  private var currentActivePackage: String? = null
  private var lastNotifiedPackage: String? = null
  private var lastNotificationTime: Long = 0L
  private var lastLimitAlertTime: Long = 0L
  private var lastBlockedToastTime: Long = 0L
  private var lastDoomscrollAlertTime: Long = 0L
  private var consecutiveShortsInApp = 0

  private lateinit var prefs: ReelCountPreferences
  private var notificationManager: NotificationManager? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    prefs = ReelCountPreferences.getInstance(this)
    notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    createNotificationChannels()
    PrototypeRuntimeStatus.connected(prefs)
    updateAmbientStatusNotification()

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

    val appLabel = TargetPackages.getDisplayLabel(packageName)
    val now = System.currentTimeMillis()

    // 1. BEDTIME SLEEP SHIELD ENFORCEMENT
    if (packageName in TargetPackages.all && prefs.isBedtimeShieldActive()) {
      overlayHud?.hide()
      currentActivePackage = null
      performGlobalAction(GLOBAL_ACTION_HOME)

      if (now - lastBlockedToastTime > 3_000L) {
        lastBlockedToastTime = now
        handler.post {
          Toast.makeText(
            applicationContext,
            "🌙 ReelCount Bedtime Shield Active\nSleep sanctuary mode: $appLabel is blocked until morning",
            Toast.LENGTH_LONG
          ).show()
        }
        triggerWarningVibration()
      }
      return
    }

    // 2. FOCUS MODE ENFORCEMENT & APP BLOCKING
    val canonicalPkg = TargetPackages.getCanonicalName(packageName)
    if (prefs.isPackageBlocked(canonicalPkg) || prefs.isPackageBlocked(packageName)) {
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

    // 3. TARGET APP MONITORING
    if (packageName !in TargetPackages.all) {
      if (currentActivePackage != null && packageName != applicationContext.packageName) {
        currentActivePackage = null
        consecutiveShortsInApp = 0
        overlayHud?.hide()
      }
      return
    }

    val isAppSwitch = currentActivePackage != packageName
    currentActivePackage = packageName
    if (isAppSwitch) {
      consecutiveShortsInApp = 0
      reducer.reset()
    }

    // Notify when opening a short-video app
    if (isAppSwitch && (lastNotifiedPackage != packageName || now - lastNotificationTime > 15_000L)) {
      lastNotifiedPackage = packageName
      lastNotificationTime = now
      val count = PrototypeRuntimeStatus.getPackageCount(canonicalPkg, prefs)
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

    // 4. CANDIDATE SCROLL DETECTION
    val rootNode = try {
      rootInActiveWindow
    } catch (_: Exception) {
      null
    }

    val detection = detector.detect(event, rootNode)
    val metadata = EventMetadata(
      eventType = event.eventType,
      packageName = packageName,
      timestamp = event.eventTime,
      reelFingerprint = detection.fingerprint,
      isCommentInteraction = detection.isCommentSection
    )

    if (trace.size == MAX_TRACE_EVENTS) trace.removeFirst()
    trace.addLast(metadata)

    val candidate = reducer.reduce(metadata)
    PrototypeRuntimeStatus.recordEvent(candidate, trace.size, packageName, prefs)

    if (candidate) {
      consecutiveShortsInApp++
      val currentPkgCount = PrototypeRuntimeStatus.getPackageCount(canonicalPkg, prefs)
      val todayTotal = prefs.getTodayCount()
      val dailyLimit = prefs.getDailyShortLimit()
      val pkgLimit = prefs.getPackageLimit(canonicalPkg)
      val isPkgLimitHit = pkgLimit > 0 && currentPkgCount >= pkgLimit
      val isLimitHit = (todayTotal >= dailyLimit) || isPkgLimitHit

      // Update HUD overlay
      overlayHud?.updateCount(appLabel, currentPkgCount, isLimitHit)
      updateAmbientStatusNotification()

      // Doomscroll Vortex Alert: 15+ consecutive shorts in a single session
      if (prefs.isDoomscrollAlertEnabled() && consecutiveShortsInApp >= 15 && (consecutiveShortsInApp % 10 == 5)) {
        if (now - lastDoomscrollAlertTime > 120_000L) {
          lastDoomscrollAlertTime = now
          sendDoomscrollNotification(consecutiveShortsInApp, appLabel)
          triggerWarningVibration()
        } else {
          triggerTickVibration()
        }
      } else if (isLimitHit) {
        // Daily or Per-App Limit Crossed
        if (todayTotal == dailyLimit || (isPkgLimitHit && currentPkgCount == pkgLimit) || (now - lastLimitAlertTime > 180_000L)) {
          lastLimitAlertTime = now
          val notifTitle = if (isPkgLimitHit) appLabel else "Daily"
          val notifLimit = if (isPkgLimitHit) pkgLimit else dailyLimit
          val notifCount = if (isPkgLimitHit) currentPkgCount else todayTotal
          sendLimitReachedNotification(notifCount, notifLimit, notifTitle)
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
      val alertChannel = NotificationChannel(
        CHANNEL_ID,
        "ReelCount Alerts",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Daily limits, Doomscroll alerts, and Focus Mode reminders"
        enableVibration(true)
      }
      val statusChannel = NotificationChannel(
        CHANNEL_STATUS_ID,
        "ReelCount Ambient Status",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Live scroll counter & quick Focus button in notification shade"
        enableVibration(false)
        setShowBadge(false)
      }
      notificationManager?.createNotificationChannel(alertChannel)
      notificationManager?.createNotificationChannel(statusChannel)
    }
  }

  private fun updateAmbientStatusNotification() {
    val nm = notificationManager ?: return
    val total = prefs.getTodayCount()
    val limit = prefs.getDailyShortLimit()
    val percent = if (limit > 0) Math.min(100, (total * 100) / limit) else 0
    val launchPendingIntent = getLaunchPendingIntent()

    val focusIntent = Intent(this, com.reelcount.quicksettings.NotificationActionReceiver::class.java).apply {
      action = com.reelcount.quicksettings.NotificationActionReceiver.ACTION_START_FOCUS
    }
    val focusFlags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    val focusPendingIntent = PendingIntent.getBroadcast(this, 201, focusIntent, focusFlags)

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val builder = android.app.Notification.Builder(this, CHANNEL_STATUS_ID)
          .setContentTitle("🎬 ReelCount: $total / $limit Shorts ($percent%)")
          .setContentText("Tap to open Dashboard · Stay mindful")
          .setSmallIcon(android.R.drawable.ic_menu_compass)
          .setOngoing(true)
          .setAutoCancel(false)

        if (launchPendingIntent != null) {
          builder.setContentIntent(launchPendingIntent)
        }

        builder.addAction(
          android.R.drawable.ic_lock_idle_lock,
          "⚡ Focus 15m",
          focusPendingIntent
        )

        nm.notify(NOTIFICATION_STATUS_ID, builder.build())
      }
    } catch (_: Exception) {}
  }

  private fun getLaunchPendingIntent(): PendingIntent? {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    } ?: return null

    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)

    return PendingIntent.getActivity(this, 0, launchIntent, flags)
  }

  private fun sendLimitReachedNotification(total: Int, limit: Int, label: String = "Daily") {
    val nm = notificationManager ?: return
    val pendingIntent = getLaunchPendingIntent()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val title = if (label == "Daily") "⚠️ ReelCount: Daily Limit Reached" else "⚠️ ReelCount: $label Limit Reached"
        val builder = android.app.Notification.Builder(this, CHANNEL_ID)
          .setContentTitle(title)
          .setContentText("You've watched $total shorts (Limit: $limit). Tap to take a mindful break.")
          .setSmallIcon(android.R.drawable.ic_dialog_alert)
          .setAutoCancel(true)

        if (pendingIntent != null) {
          builder.setContentIntent(pendingIntent)
        }

        nm.notify(NOTIFICATION_LIMIT_ID, builder.build())
      }
    } catch (_: Exception) {}
  }

  private fun sendDoomscrollNotification(consecutive: Int, appName: String) {
    val nm = notificationManager ?: return
    val pendingIntent = getLaunchPendingIntent()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val builder = android.app.Notification.Builder(this, CHANNEL_ID)
          .setContentTitle("🌪️ Doomscroll Loop Warning")
          .setContentText("$consecutive shorts watched in a row on $appName. Take a 4-4-4 breathing reset!")
          .setSmallIcon(android.R.drawable.ic_popup_reminder)
          .setAutoCancel(true)

        if (pendingIntent != null) {
          builder.setContentIntent(pendingIntent)
        }

        nm.notify(NOTIFICATION_DOOMSCROLL_ID, builder.build())
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
    consecutiveShortsInApp = 0
    PrototypeRuntimeStatus.interrupted()
    overlayHud?.hide()
  }

  override fun onUnbind(intent: Intent?): Boolean {
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
    consecutiveShortsInApp = 0
    PrototypeRuntimeStatus.disconnected()
    overlayHud?.hide()
    currentActivePackage = null
    try {
      notificationManager?.cancel(NOTIFICATION_STATUS_ID)
    } catch (_: Exception) {}
  }

  private fun clearIdleTrace() {
    trace.clear()
    consecutiveShortsInApp = 0
    PrototypeRuntimeStatus.clearTrace()
  }

  private companion object {
    const val MAX_TRACE_EVENTS = 32
    const val TRACE_IDLE_TIMEOUT_MS = 2_000L
    const val CHANNEL_ID = "reelcount_alerts"
    const val CHANNEL_STATUS_ID = "reelcount_status"
    const val NOTIFICATION_LIMIT_ID = 1001
    const val NOTIFICATION_DOOMSCROLL_ID = 1002
    const val NOTIFICATION_STATUS_ID = 1003
  }
}