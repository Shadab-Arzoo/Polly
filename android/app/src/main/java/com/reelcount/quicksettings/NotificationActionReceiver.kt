package com.reelcount.quicksettings

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast
import com.reelcount.tracking.ReelCountPreferences
import com.reelcount.tracking.TargetPackages

/**
 * BroadcastReceiver for handling interactive notification action buttons:
 * - 'ACTION_START_FOCUS': Instantly begins a 15-minute distraction-free Focus block.
 * - 'ACTION_STOP_FOCUS': Ends active Focus mode.
 */
class NotificationActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val prefs = ReelCountPreferences.getInstance(context)

    when (intent.action) {
      ACTION_START_FOCUS -> {
        prefs.setFocusMode(true, 15, TargetPackages.all)
        Toast.makeText(context, "🔒 ReelCount: 15m Focus Session Started", Toast.LENGTH_SHORT).show()
      }
      ACTION_STOP_FOCUS -> {
        prefs.setFocusMode(false, 0, emptySet())
        Toast.makeText(context, "ReelCount: Focus Session Ended", Toast.LENGTH_SHORT).show()
      }
    }
  }

  companion object {
    const val ACTION_START_FOCUS = "com.reelcount.action.START_FOCUS"
    const val ACTION_STOP_FOCUS = "com.reelcount.action.STOP_FOCUS"
  }
}
