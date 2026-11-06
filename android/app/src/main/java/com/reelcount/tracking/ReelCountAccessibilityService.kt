package com.reelcount.tracking

import android.accessibilityservice.AccessibilityService
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import java.util.ArrayDeque

/** Event-only feasibility prototype. No event object or content-bearing field is retained. */
class ReelCountAccessibilityService : AccessibilityService() {
  private val trace = ArrayDeque<EventMetadata>(MAX_TRACE_EVENTS)
  private val reducer = CandidateTransitionReducer()
  private val handler = Handler(Looper.getMainLooper())
  private val clearIdleState = Runnable { clearTransientState() }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return

    // Read only these allowlisted properties. Never inspect text, source, descriptions, or nodes.
    val packageName = event.packageName?.toString() ?: return
    if (packageName !in TargetPackages.all) return
    val metadata = EventMetadata(event.eventType, packageName, event.eventTime)

    if (trace.size == MAX_TRACE_EVENTS) trace.removeFirst()
    trace.addLast(metadata)
    reducer.reduce(metadata) // Candidate output remains experimental and is not presented as a count.
    handler.removeCallbacks(clearIdleState)
    handler.postDelayed(clearIdleState, TRACE_IDLE_TIMEOUT_MS)
  }

  override fun onInterrupt() = clearTransientState()

  override fun onUnbind(intent: android.content.Intent?): Boolean {
    clearTransientState()
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    clearTransientState()
    super.onDestroy()
  }

  private fun clearTransientState() {
    handler.removeCallbacks(clearIdleState)
    trace.clear()
    reducer.reset()
  }

  private companion object {
    const val MAX_TRACE_EVENTS = 128
    const val TRACE_IDLE_TIMEOUT_MS = 5_000L
  }
}
