package com.reelcount.tracking

/** Process-only tester status. No event details or content are exposed through the bridge. */
internal object PrototypeRuntimeStatus {
  private var serviceConnected = false
  private var candidateCount = 0
  private var bufferedEventCount = 0

  @Synchronized
  fun connected() {
    serviceConnected = true
    candidateCount = 0
    bufferedEventCount = 0
  }

  @Synchronized
  fun disconnected() {
    serviceConnected = false
    candidateCount = 0
    bufferedEventCount = 0
  }

  @Synchronized
  fun interrupted() {
    candidateCount = 0
    bufferedEventCount = 0
  }

  @Synchronized
  fun recordEvent(candidate: Boolean, bufferedEvents: Int) {
    if (candidate) candidateCount += 1
    bufferedEventCount = bufferedEvents
  }

  @Synchronized
  fun clearTrace() {
    bufferedEventCount = 0
  }

  @Synchronized
  fun snapshot() = Snapshot(serviceConnected, candidateCount, bufferedEventCount)

  internal data class Snapshot(
    val serviceConnected: Boolean,
    val candidateCount: Int,
    val bufferedEventCount: Int,
  )
}
