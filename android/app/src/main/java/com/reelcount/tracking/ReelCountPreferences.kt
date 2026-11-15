package com.reelcount.tracking

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Thread-safe preferences storage for ReelCount:
 * - Focus Mode enforcement & blocked package management
 * - Daily limits & reminder settings
 * - Persistent daily short counters & 7-day history
 * - HUD screen position memory
 */
class ReelCountPreferences private constructor(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

  private fun getTodayKey(): String = dateFormat.format(Date())

  // --- Focus Mode & Blocking ---

  fun setFocusMode(active: Boolean, durationMinutes: Int, blockedPackages: Set<String>) {
    val now = System.currentTimeMillis()
    val endTime = if (active) now + (durationMinutes * 60 * 1000L) else 0L

    prefs.edit()
      .putBoolean(KEY_FOCUS_ACTIVE, active)
      .putLong(KEY_FOCUS_END_TIME, endTime)
      .putStringSet(KEY_BLOCKED_PACKAGES, blockedPackages)
      .apply()
  }

  fun isFocusModeActive(): Boolean {
    val active = prefs.getBoolean(KEY_FOCUS_ACTIVE, false)
    if (!active) return false
    val endTime = prefs.getLong(KEY_FOCUS_END_TIME, 0L)
    if (System.currentTimeMillis() > endTime) {
      // Focus mode expired
      prefs.edit().putBoolean(KEY_FOCUS_ACTIVE, false).apply()
      return false
    }
    return true
  }

  fun isPackageBlocked(packageName: String): Boolean {
    if (!isFocusModeActive()) return false
    val blocked = prefs.getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()
    return packageName in blocked
  }

  fun getFocusRemainingSeconds(): Long {
    if (!isFocusModeActive()) return 0L
    val endTime = prefs.getLong(KEY_FOCUS_END_TIME, 0L)
    val remaining = (endTime - System.currentTimeMillis()) / 1000L
    return if (remaining > 0) remaining else 0L
  }

  // --- Daily Limits ---

  fun setDailyLimits(shortLimit: Int, timeLimitMinutes: Int) {
    prefs.edit()
      .putInt(KEY_DAILY_SHORT_LIMIT, shortLimit)
      .putInt(KEY_DAILY_TIME_LIMIT_MIN, timeLimitMinutes)
      .apply()
  }

  fun getDailyShortLimit(): Int = prefs.getInt(KEY_DAILY_SHORT_LIMIT, 50)

  fun getDailyTimeLimitMinutes(): Int = prefs.getInt(KEY_DAILY_TIME_LIMIT_MIN, 30)

  // --- Persistent Counting & 7-Day History ---

  @Synchronized
  fun incrementCount(packageName: String): Int {
    val today = getTodayKey()
    val totalKey = "count_${today}_total"
    val pkgKey = "count_${today}_$packageName"

    val newTotal = prefs.getInt(totalKey, 0) + 1
    val newPkgCount = prefs.getInt(pkgKey, 0) + 1

    prefs.edit()
      .putInt(totalKey, newTotal)
      .putInt(pkgKey, newPkgCount)
      .apply()

    return newTotal
  }

  fun getTodayCount(): Int {
    val today = getTodayKey()
    return prefs.getInt("count_${today}_total", 0)
  }

  fun getTodayPackageCount(packageName: String): Int {
    val today = getTodayKey()
    return prefs.getInt("count_${today}_$packageName", 0)
  }

  fun resetTodayCounts() {
    val today = getTodayKey()
    val editor = prefs.edit()
    editor.putInt("count_${today}_total", 0)
    for (pkg in TargetPackages.all) {
      editor.putInt("count_${today}_$pkg", 0)
    }
    editor.apply()
  }

  fun get7DayHistory(): List<DayCount> {
    val result = mutableListOf<DayCount>()
    val cal = java.util.Calendar.getInstance()
    val dayNames = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

    for (i in 6 downTo 0) {
      val c = java.util.Calendar.getInstance().apply {
        add(java.util.Calendar.DAY_OF_YEAR, -i)
      }
      val dateStr = dateFormat.format(c.time)
      val dayLabel = if (i == 0) "Today" else dayNames[c.get(java.util.Calendar.DAY_OF_WEEK) - 1]
      val count = prefs.getInt("count_${dateStr}_total", 0)
      result.add(DayCount(dateStr, dayLabel, count))
    }
    return result
  }

  // --- Onboarding Status ---

  fun isOnboardingCompleted(): Boolean {
    return prefs.getBoolean(KEY_ONBOARDING_COMPLETED, false)
  }

  fun setOnboardingCompleted(completed: Boolean) {
    prefs.edit().putBoolean(KEY_ONBOARDING_COMPLETED, completed).apply()
  }

  // --- HUD Screen Position Memory ---

  fun saveHudPosition(x: Int, y: Int) {
    prefs.edit()
      .putInt(KEY_HUD_X, x)
      .putInt(KEY_HUD_Y, y)
      .apply()
  }

  fun getSavedHudPosition(): Pair<Int, Int>? {
    if (!prefs.contains(KEY_HUD_X) || !prefs.contains(KEY_HUD_Y)) return null
    return Pair(prefs.getInt(KEY_HUD_X, 16), prefs.getInt(KEY_HUD_Y, 72))
  }

  data class DayCount(val date: String, val label: String, val count: Int)

  companion object {
    private const val PREFS_NAME = "reelcount_preferences"
    private const val KEY_FOCUS_ACTIVE = "focus_mode_active"
    private const val KEY_FOCUS_END_TIME = "focus_mode_end_time"
    private const val KEY_BLOCKED_PACKAGES = "blocked_packages"
    private const val KEY_DAILY_SHORT_LIMIT = "daily_short_limit"
    private const val KEY_DAILY_TIME_LIMIT_MIN = "daily_time_limit_min"
    private const val KEY_ONBOARDING_COMPLETED = "onboarding_completed"
    private const val KEY_HUD_X = "hud_pos_x"
    private const val KEY_HUD_Y = "hud_pos_y"

    @Volatile
    private var INSTANCE: ReelCountPreferences? = null

    fun getInstance(context: Context): ReelCountPreferences {
      return INSTANCE ?: synchronized(this) {
        INSTANCE ?: ReelCountPreferences(context).also { INSTANCE = it }
      }
    }
  }
}
