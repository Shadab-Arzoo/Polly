package com.reelcount.tracking

import android.accessibilityservice.AccessibilityService
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast
import java.util.ArrayDeque

/** Event-only feasibility prototype. No event object or content-bearing field is retained. */
class ReelCountAccessibilityService : AccessibilityService() {
  private val trace = ArrayDeque<EventMetadata>(MAX_TRACE_EVENTS)
  private val reducer = CandidateTransitionReducer()
  private val handler = Handler(Looper.getMainLooper())
  private val clearIdleState = Runnable { clearIdleTrace() }
  private var overlayHud: ReelCountOverlayHud? = null
  private var currentActivePackage: String? = null
  private var lastNotifiedPackage: String? = null
  private var lastNotificationTime: Long = 0L

  override fun onServiceConnected() {
    super.onServiceConnected()
    PrototypeRuntimeStatus.connected()
    if (overlayHud == null) {
      overlayHud = ReelCountOverlayHud(this)
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return

    val packageName = event.packageName?.toString() ?: return

    // If leaving a monitored video app to an unrelated app or launcher, hide the HUD
    if (packageName !in TargetPackages.all) {
      if (currentActivePackage != null && packageName != applicationContext.packageName) {
        currentActivePackage = null
        overlayHud?.hide()
      }
      return
    }

    val appLabel = when (packageName) {
      TargetPackages.INSTAGRAM -> "Instagram Reels"
      TargetPackages.TIKTOK -> "TikTok"
      TargetPackages.YOUTUBE -> "YouTube Shorts"
      TargetPackages.SNAPCHAT -> "Snapchat Spotlight"
      else -> "Shorts"
    }

    val now = System.currentTimeMillis()
    val isAppSwitch = currentActivePackage != packageName
    currentActivePackage = packageName

    // Notify when opening a short-video app (debounced to avoid multiple alerts while using the app)
    if (isAppSwitch && (lastNotifiedPackage != packageName || now - lastNotificationTime > 15_000L)) {
      lastNotifiedPackage = packageName
      lastNotificationTime = now
      val count = PrototypeRuntimeStatus.getPackageCount(packageName)

      handler.post {
        Toast.makeText(
          applicationContext,
          "🎬 ReelCount: $appLabel opened · Counter active",
          Toast.LENGTH_SHORT
        ).show()
      }
      overlayHud?.show(appLabel, count)
    }

    val metadata = EventMetadata(event.eventType, packageName, event.eventTime)
    if (trace.size == MAX_TRACE_EVENTS) trace.removeFirst()
    trace.addLast(metadata)
    val candidate = reducer.reduce(metadata)
    PrototypeRuntimeStatus.recordEvent(candidate, trace.size, packageName)

    // When the user swipes / transitions content, update the on-screen counter
    if (candidate) {
      val currentCount = PrototypeRuntimeStatus.getPackageCount(packageName)
      overlayHud?.updateCount(appLabel, currentCount)
    }

    handler.removeCallbacks(clearIdleState)
    handler.postDelayed(clearIdleState, TRACE_IDLE_TIMEOUT_MS)
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
    currentActivePackage = null
    overlayHud?.hide()
    PrototypeRuntimeStatus.disconnected()
  }

  private fun clearIdleTrace() {
    trace.clear()
    PrototypeRuntimeStatus.clearTrace()
  }

  private companion object {
    const val MAX_TRACE_EVENTS = 128
    const val TRACE_IDLE_TIMEOUT_MS = 5_000L
  }
}
