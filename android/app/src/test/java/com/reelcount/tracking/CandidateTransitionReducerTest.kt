package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CandidateTransitionReducerTest {
  private val reducer = CandidateTransitionReducer(debounceMillis = 700L)

  @Test
  fun firstScrollEventFromTargetIsCandidate() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.TIKTOK, 1_000L)))
  }

  @Test
  fun repeatedScrollBurstWithinDebounceIsSuppressed() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM, 1_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM, 1_699L)))
  }

  @Test
  fun scrollAtDebounceBoundaryIsCandidate() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.SNAPCHAT, 1_000L)))
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.SNAPCHAT, 1_700L)))
  }

  @Test
  fun unrelatedEventAndPackageAreNotCandidates() {
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED, TargetPackages.YOUTUBE, 1_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, "com.example.other", 1_000L)))
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_001L)))
  }

  @Test
  fun resetAllowsNextScrollImmediately() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_000L)))
    reducer.reset()
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_001L)))
  }

  @Test
  fun outOfOrderEventDoesNotMoveDebounceWindowBackwards() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 2_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 2_001L)))
  }

  @Test
  fun commentInteractionsAreStrictlyRejected() {
    // Opening comments or scrolling comments should NEVER trigger a reel candidate count
    val commentEvent = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = null,
      isCommentInteraction = true
    )
    assertFalse(reducer.reduce(commentEvent))

    // Even with a fingerprint present, if comment section is active, it is rejected
    val commentWithReelEvent = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_000L,
      reelFingerprint = "creatorA||songA||funny video",
      isCommentInteraction = true
    )
    assertFalse(reducer.reduce(commentWithReelEvent))
  }

  @Test
  fun fingerprintTransitionsDetectReelSwipesAccurately() {
    // First reel transition
    val reel1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel1))

    // Staying on same reel with further content updates or touch gestures does NOT count again
    val reel1Update = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_300L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(reel1Update))

    // Opening comments on reel1 does NOT count
    val commentsOpen = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_500L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = true
    )
    assertFalse(reducer.reduce(commentsOpen))

    // Swiping to new reel (different fingerprint) after debounce period is detected!
    val reel2 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_200L,
      reelFingerprint = "creatorB||songB||clip2",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel2))
  }

  private fun event(type: Int, packageName: String, timestamp: Long) =
    EventMetadata(type, packageName, timestamp)
}
