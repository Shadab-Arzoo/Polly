package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent

/** The only event fields retained by the prototype's bounded, in-memory trace. */
internal data class EventMetadata(
  val eventType: Int,
  val packageName: String,
  val timestamp: Long,
)

/** Experimental signal only; it does not identify a unique video or produce a reliable count. */
internal class CandidateTransitionReducer(
  private val debounceMillis: Long = DEFAULT_DEBOUNCE_MILLIS,
) {
  private var lastCandidateTimestamp: Long? = null

  fun reduce(event: EventMetadata): Boolean {
    if (
      event.packageName !in TargetPackages.all ||
        event.eventType != AccessibilityEvent.TYPE_VIEW_SCROLLED
    ) {
      return false
    }

    val previousTimestamp = lastCandidateTimestamp
    if (
      previousTimestamp != null &&
        (event.timestamp < previousTimestamp || event.timestamp - previousTimestamp < debounceMillis)
    ) {
      return false
    }

    lastCandidateTimestamp = event.timestamp
    return true
  }

  fun reset() {
    lastCandidateTimestamp = null
  }

  private companion object {
    const val DEFAULT_DEBOUNCE_MILLIS = 700L
  }
}
