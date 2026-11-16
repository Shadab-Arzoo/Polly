package com.reelcount.tracking

/** Process-only tester status. Synchronized with persistent ReelCountPreferences. */
internal object PrototypeRuntimeStatus {
  private var serviceConnected = false
  private var candidateCount = 0
  private var bufferedEventCount = 0
  private val packageCounts = mutableMapOf<String, Int>()

  @Synchronized
  fun connected(prefs: ReelCountPreferences? = null) {
    serviceConnected = true
    bufferedEventCount = 0
    if (prefs != null) {
      candidateCount = prefs.getTodayCount()
      packageCounts.clear()
      for (pkg in TargetPackages.all) {
        packageCounts[pkg] = prefs.getTodayPackageCount(pkg)
      }
    }
  }

  @Synchronized
  fun disconnected() {
    serviceConnected = false
    bufferedEventCount = 0
  }

  @Synchronized
  fun interrupted() {
    bufferedEventCount = 0
  }

  @Synchronized
  fun recordEvent(
    candidate: Boolean,
    bufferedEvents: Int,
    packageName: String? = null,
    prefs: ReelCountPreferences? = null
  ) {
    if (candidate) {
      val canonical = packageName?.let { TargetPackages.getCanonicalName(it) }
      if (prefs != null && canonical != null) {
        candidateCount = prefs.incrementCount(canonical)
        packageCounts[canonical] = prefs.getTodayPackageCount(canonical)
      } else {
        candidateCount += 1
        if (canonical != null) {
          packageCounts[canonical] = (packageCounts[canonical] ?: 0) + 1
        }
      }
    }
    bufferedEventCount = bufferedEvents
  }

  @Synchronized
  fun clearTrace() {
    bufferedEventCount = 0
  }

  @Synchronized
  fun getPackageCount(packageName: String, prefs: ReelCountPreferences? = null): Int {
    return if (prefs != null) {
      prefs.getTodayPackageCount(packageName)
    } else {
      packageCounts[packageName] ?: 0
    }
  }

  @Synchronized
  fun reset(prefs: ReelCountPreferences? = null) {
    candidateCount = 0
    bufferedEventCount = 0
    packageCounts.clear()
    prefs?.resetTodayCounts()
  }

  @Synchronized
  fun snapshot(prefs: ReelCountPreferences? = null): Snapshot {
    val count = prefs?.getTodayCount() ?: candidateCount
    val map = HashMap<String, Int>()
    if (prefs != null) {
      for (pkg in TargetPackages.all) {
        map[pkg] = prefs.getTodayPackageCount(pkg)
      }
    } else {
      map.putAll(packageCounts)
    }

    return Snapshot(
      serviceConnected,
      count,
      bufferedEventCount,
      map
    )
  }

  internal data class Snapshot(
    val serviceConnected: Boolean,
    val candidateCount: Int,
    val bufferedEventCount: Int,
    val packageCounts: Map<String, Int> = emptyMap(),
  )
}
