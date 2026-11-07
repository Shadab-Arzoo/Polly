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
  fun rapidSwitchBetweenDifferentPackagesDoesNotSuppressSecondPackage() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM, 1_000L)))
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.TIKTOK, 1_100L)))
  }

  private fun event(type: Int, packageName: String, timestamp: Long) =
    EventMetadata(type, packageName, timestamp)
}
