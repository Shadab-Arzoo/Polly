package com.reelcount.quicksettings

import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.widget.Toast
import com.reelcount.tracking.ReelCountPreferences
import com.reelcount.tracking.TargetPackages

/**
 * Android Quick Settings Notification Shade Tile.
 *
 * Allows users to toggle a 15-minute Focus Session directly from
 * their Android quick settings pull-down menu without even opening the app.
 */
class FocusTileService : TileService() {
  override fun onStartListening() {
    super.onStartListening()
    updateTileState()
  }

  override fun onClick() {
    super.onClick()
    val prefs = ReelCountPreferences.getInstance(this)
    val currentlyActive = prefs.isFocusModeActive()

    if (!currentlyActive) {
      // Activate 15-minute Focus Mode across all target packages
      prefs.setFocusMode(true, 15, TargetPackages.all)
      Toast.makeText(this, "🔒 ReelCount: 15-minute Focus Mode Activated", Toast.LENGTH_SHORT).show()
    } else {
      // Deactivate Focus Mode
      prefs.setFocusMode(false, 0, emptySet())
      Toast.makeText(this, "ReelCount: Focus Mode Deactivated", Toast.LENGTH_SHORT).show()
    }

    updateTileState()
  }

  private fun updateTileState() {
    val tile = qsTile ?: return
    val prefs = ReelCountPreferences.getInstance(this)
    val active = prefs.isFocusModeActive()

    if (active) {
      val remainingMin = (prefs.getFocusRemainingSeconds() / 60) + 1
      tile.state = Tile.STATE_ACTIVE
      tile.label = "Focus ($remainingMin m)"
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        tile.subtitle = "Blocking Shorts"
      }
    } else {
      tile.state = Tile.STATE_INACTIVE
      tile.label = "ReelCount Focus"
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        tile.subtitle = "Tap to Block 15m"
      }
    }
    tile.updateTile()
  }
}
