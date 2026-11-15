package com.reelcount.tracking

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PrototypeRuntimeStatusTest {
  @After
  fun reset() {
    PrototypeRuntimeStatus.disconnected()
  }

  @Test
  fun snapshotExposesOnlySessionCountersAndConnectionState() {
    PrototypeRuntimeStatus.connected()
    PrototypeRuntimeStatus.recordEvent(candidate = true, bufferedEvents = 1)
    PrototypeRuntimeStatus.recordEvent(candidate = false, bufferedEvents = 2)

    val snapshot = PrototypeRuntimeStatus.snapshot()
    assertTrue(snapshot.serviceConnected)
    assertEquals(1, snapshot.candidateCount)
    assertEquals(2, snapshot.bufferedEventCount)
  }

  @Test
  fun clearingTraceRetainsCandidateTotalUntilDisconnect() {
    PrototypeRuntimeStatus.connected()
    PrototypeRuntimeStatus.recordEvent(candidate = true, bufferedEvents = 1)
    PrototypeRuntimeStatus.clearTrace()

    val snapshot = PrototypeRuntimeStatus.snapshot()
    assertEquals(1, snapshot.candidateCount)
    assertEquals(0, snapshot.bufferedEventCount)
  }

  @Test
  fun disconnectClearsAllTransientCounters() {
    PrototypeRuntimeStatus.connected()
    PrototypeRuntimeStatus.recordEvent(candidate = true, bufferedEvents = 1)
    PrototypeRuntimeStatus.disconnected()

    val snapshot = PrototypeRuntimeStatus.snapshot()
    assertFalse(snapshot.serviceConnected)
    assertEquals(0, snapshot.candidateCount)
    assertEquals(0, snapshot.bufferedEventCount)
  }
}
