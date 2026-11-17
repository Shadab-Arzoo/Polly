package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent

/**
 * Event metadata retained by the tracking engine.
 * Includes optional reel fingerprint and comment section flags for precision tracking.
 */
internal data class EventMetadata(
  val eventType: Int,
  val packageName: String,
  val timestamp: Long,
  val reelFingerprint: String? = null,
  val isCommentInteraction: Boolean = false,
)

/**
 * Pure transition reducer with fingerprint-based video deduplication,
 * comments-section exclusion, and temporal burst debouncing.
 */
internal class CandidateTransitionReducer(
  private val debounceMillis: Long = DEFAULT_DEBOUNCE_MILLIS,
) {
  private var lastCandidateTimestamp: Long? = null
  private var lastReelFingerprint: String? = null

  fun reduce(event: EventMetadata): Boolean {
    if (event.packageName !in TargetPackages.all) {
      return false
    }

    // Explicit comment interactions are never counted as short-video transitions
    if (event.isCommentInteraction) {
      return false
    }

    val previousTimestamp = lastCandidateTimestamp

    // Fingerprint-based detection: unique video transition
    if (event.reelFingerprint != null) {
      if (event.reelFingerprint == lastReelFingerprint) {
        return false
      }
      if (
        previousTimestamp != null &&
          (event.timestamp < previousTimestamp || event.timestamp - previousTimestamp < debounceMillis)
      ) {
        return false
      }

      lastReelFingerprint = event.reelFingerprint
      lastCandidateTimestamp = event.timestamp
      return true
    }

    // Fallback detection: view scroll or item select events
    if (
      event.eventType != AccessibilityEvent.TYPE_VIEW_SCROLLED &&
      event.eventType != AccessibilityEvent.TYPE_VIEW_SELECTED
    ) {
      return false
    }

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
    lastReelFingerprint = null
  }

  private companion object {
    const val DEFAULT_DEBOUNCE_MILLIS = 700L
  }
}
