package com.reelcount.tracking

/** Process-only tester status. No event details or content are exposed through the bridge. */
internal object PrototypeRuntimeStatus {
  private var serviceConnected = false
  private var candidateCount = 0
  private var bufferedEventCount = 0
  private val packageCounts = mutableMapOf<String, Int>()

  @Synchronized
  fun connected() {
    serviceConnected = true
    candidateCount = 0
    bufferedEventCount = 0
    packageCounts.clear()
  }

  @Synchronized
  fun disconnected() {
    serviceConnected = false
    candidateCount = 0
    bufferedEventCount = 0
    packageCounts.clear()
  }

  @Synchronized
  fun interrupted() {
    candidateCount = 0
    bufferedEventCount = 0
    packageCounts.clear()
  }

  @Synchronized
  fun recordEvent(candidate: Boolean, bufferedEvents: Int, packageName: String? = null) {
    if (candidate) {
      candidateCount += 1
      if (packageName != null) {
        packageCounts[packageName] = (packageCounts[packageName] ?: 0) + 1
      }
    }
    bufferedEventCount = bufferedEvents
  }

  @Synchronized
  fun clearTrace() {
    bufferedEventCount = 0
  }

  @Synchronized
  fun getPackageCount(packageName: String): Int = packageCounts[packageName] ?: 0

  @Synchronized
  fun reset() {
    candidateCount = 0
    bufferedEventCount = 0
    packageCounts.clear()
  }

  @Synchronized
  fun snapshot() = Snapshot(
    serviceConnected,
    candidateCount,
    bufferedEventCount,
    HashMap(packageCounts)
  )

  internal data class Snapshot(
    val serviceConnected: Boolean,
    val candidateCount: Int,
    val bufferedEventCount: Int,
    val packageCounts: Map<String, Int> = emptyMap(),
  )
}
