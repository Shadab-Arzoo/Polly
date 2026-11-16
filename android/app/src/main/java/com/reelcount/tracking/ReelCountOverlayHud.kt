package com.reelcount.tracking

import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

/**
 * Interactive on-screen floating HUD overlay that displays live scroll counts
 * over supported short-form video applications using TYPE_ACCESSIBILITY_OVERLAY.
 *
 * Enhanced features:
 * - Draggable screen position memory (persisted via ReelCountPreferences)
 * - Single-Tap cycling: App Count → Daily Total & Quota → Time Spent Estimate
 * - Long-Press (>500ms): Instant launch into ReelCount Dashboard
 * - HUD Style adaptation: 'pill' (rich), 'dot' (minimalist badge), or 'warning_only'
 * - Dynamic pulse animations on each scroll transition
 * - Limit reached warning alert states (red glowing indicator)
 */
class ReelCountOverlayHud(private val context: Context) {
  private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private val prefs = ReelCountPreferences.getInstance(context)

  private var hudView: LinearLayout? = null
  private var titleView: TextView? = null
  private var counterView: TextView? = null
  private var iconView: TextView? = null
  private var backgroundDrawable: GradientDrawable? = null
  private var isAttached = false
  private var isVisible = false

  // Display cycle: 0 = Current App, 1 = Daily Total / Limit, 2 = Estimated Minutes
  private var displayCycleMode = 0
  private var currentAppLabel = "Shorts"
  private var currentAppCount = 0
  private var isCurrentLimitReached = false

  private val layoutParams = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
    PixelFormat.TRANSLUCENT
  ).apply {
    gravity = Gravity.TOP or Gravity.END
    val savedPos = prefs.getSavedHudPosition()
    if (savedPos != null) {
      x = savedPos.first
      y = savedPos.second
    } else {
      x = dpToPx(16)
      y = dpToPx(72)
    }
  }

  init {
    handler.post { setupView() }
  }

  private fun getThemeAccentColor(): Int {
    return when (prefs.getThemeAccent().lowercase()) {
      "mint" -> Color.parseColor("#6EE3AD")
      "cyan" -> Color.parseColor("#38BDF8")
      "amethyst" -> Color.parseColor("#C084FC")
      "amber" -> Color.parseColor("#FBBF24")
      "monochrome" -> Color.parseColor("#F9F8F9")
      else -> Color.parseColor("#6EE3AD")
    }
  }

  private fun setupView() {
    if (hudView != null) return

    val accent = getThemeAccentColor()
    val bg = GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadius = dpToPx(24).toFloat()
      setColor(Color.parseColor("#E60B0B0B"))
      setStroke(dpToPx(2), accent)
    }
    backgroundDrawable = bg

    val container = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      val padH = dpToPx(14)
      val padV = dpToPx(8)
      setPadding(padH, padV, padH, padV)
      background = bg
      elevation = dpToPx(8).toFloat()
    }

    val icon = TextView(context).apply {
      text = "✦ "
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
      setTextColor(accent)
    }

    val title = TextView(context).apply {
      text = "Shorts: "
      setTextColor(Color.parseColor("#E5E5E4"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    val counter = TextView(context).apply {
      text = "0"
      setTextColor(accent)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    container.addView(icon)
    container.addView(title)
    container.addView(counter)

    // Interactive gestures: Drag to reposition, Tap to cycle modes, Long-press to launch ReelCount
    var initialX = 0
    var initialY = 0
    var touchStartX = 0f
    var touchStartY = 0f
    var touchStartTime = 0L

    container.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = layoutParams.x
          initialY = layoutParams.y
          touchStartX = event.rawX
          touchStartY = event.rawY
          touchStartTime = System.currentTimeMillis()
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val deltaX = (event.rawX - touchStartX).toInt()
          val deltaY = (event.rawY - touchStartY).toInt()
          layoutParams.x = initialX - deltaX
          layoutParams.y = initialY + deltaY
          if (isAttached && hudView != null) {
            try {
              windowManager?.updateViewLayout(hudView, layoutParams)
            } catch (_: Exception) {}
          }
          true
        }
        MotionEvent.ACTION_UP -> {
          val deltaX = Math.abs(event.rawX - touchStartX)
          val deltaY = Math.abs(event.rawY - touchStartY)
          val duration = System.currentTimeMillis() - touchStartTime
          val isTap = deltaX < dpToPx(10) && deltaY < dpToPx(10)

          if (isTap) {
            if (duration >= 500) {
              // Long Press: Launch ReelCount Dashboard
              triggerHaptic(30)
              launchReelCountApp()
            } else {
              // Single Tap: Cycle HUD metrics
              triggerHaptic(12)
              displayCycleMode = (displayCycleMode + 1) % 3
              updateContent(currentAppLabel, currentAppCount, isCurrentLimitReached)
              pulse()
            }
          } else {
            // Drag completed: Persist user's preferred HUD coordinates
            prefs.saveHudPosition(layoutParams.x, layoutParams.y)
          }
          true
        }
        else -> false
      }
    }

    hudView = container
    titleView = title
    counterView = counter
    iconView = icon
  }

  private var speedbumpActive = false

  fun show(appLabel: String, count: Int, limitReached: Boolean = false) {
    handler.post {
      ensureAttached()
      currentAppLabel = appLabel
      currentAppCount = count
      isCurrentLimitReached = limitReached

      if (prefs.isSpeedbumpEnabled()) {
        triggerSpeedbump(appLabel, count, limitReached)
      } else {
        applyHudStyleVisibility(limitReached)
        updateContent(appLabel, count, limitReached)
        pulse()
      }
    }
  }

  private fun triggerSpeedbump(appLabel: String, count: Int, limitReached: Boolean) {
    speedbumpActive = true
    hudView?.visibility = View.VISIBLE
    isVisible = true

    val accent = getThemeAccentColor()
    iconView?.visibility = View.VISIBLE
    titleView?.visibility = View.VISIBLE
    iconView?.text = "✦ "
    titleView?.text = "Pause & Breathe: "
    titleView?.setTextColor(accent)
    counterView?.text = "3s"
    counterView?.setTextColor(accent)
    backgroundDrawable?.setStroke(dpToPx(2), accent)
    pulse()

    handler.postDelayed({
      if (speedbumpActive) {
        counterView?.text = "2s"
        pulse()
      }
    }, 1000L)

    handler.postDelayed({
      if (speedbumpActive) {
        counterView?.text = "1s"
        pulse()
      }
    }, 2000L)

    handler.postDelayed({
      if (speedbumpActive) {
        speedbumpActive = false
        applyHudStyleVisibility(limitReached)
        updateContent(appLabel, count, limitReached)
        pulse()
      }
    }, 3000L)
  }

  fun updateCount(appLabel: String, count: Int, limitReached: Boolean = false) {
    handler.post {
      ensureAttached()
      currentAppLabel = appLabel
      currentAppCount = count
      isCurrentLimitReached = limitReached
      speedbumpActive = false
      applyHudStyleVisibility(limitReached)
      updateContent(appLabel, count, limitReached)
      pulse()
    }
  }

  private fun applyHudStyleVisibility(limitReached: Boolean) {
    val style = prefs.getHudStyle()
    val todayTotal = prefs.getTodayCount()
    val dailyLimit = prefs.getDailyShortLimit()

    if (style == "warning_only") {
      val isNearLimit = todayTotal >= (dailyLimit * 0.8)
      if (limitReached || isNearLimit) {
        hudView?.visibility = View.VISIBLE
        isVisible = true
      } else {
        hudView?.visibility = View.GONE
        isVisible = false
      }
      return
    }

    hudView?.visibility = View.VISIBLE
    isVisible = true
  }

  private fun updateContent(appLabel: String, count: Int, limitReached: Boolean) {
    val style = prefs.getHudStyle()
    val shortLabel = TargetPackages.getShortBadgeLabel(appLabel)
    val todayTotal = prefs.getTodayCount()
    val dailyLimit = prefs.getDailyShortLimit()
    // Estimate: ~30 seconds per short video
    val estimatedMins = (todayTotal * 30) / 60

    val isDot = style == "dot"

    if (isDot) {
      iconView?.visibility = View.GONE
      titleView?.visibility = View.GONE
      counterView?.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
      val pad = dpToPx(8)
      hudView?.setPadding(pad, pad, pad, pad)
    } else {
      iconView?.visibility = View.VISIBLE
      titleView?.visibility = View.VISIBLE
      counterView?.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      val padH = dpToPx(14)
      val padV = dpToPx(8)
      hudView?.setPadding(padH, padV, padH, padV)
    }

    if (limitReached) {
      iconView?.text = "⚠️ "
      when (displayCycleMode) {
        0 -> {
          titleView?.text = "Limit Hit! "
          counterView?.text = "$count"
        }
        1 -> {
          titleView?.text = "Today: "
          counterView?.text = "$todayTotal/$dailyLimit"
        }
        else -> {
          titleView?.text = "Time: "
          counterView?.text = "${estimatedMins}m"
        }
      }
      titleView?.setTextColor(Color.parseColor("#FCA5A5"))
      counterView?.setTextColor(Color.parseColor("#EF4444"))
      backgroundDrawable?.setStroke(dpToPx(2), Color.parseColor("#EF4444"))
    } else {
      val accent = getThemeAccentColor()
      iconView?.setTextColor(accent)
      when (displayCycleMode) {
        0 -> {
          iconView?.text = "✦ "
          titleView?.text = "$shortLabel: "
          counterView?.text = "$count"
        }
        1 -> {
          iconView?.text = "◈ "
          titleView?.text = "Today: "
          counterView?.text = "$todayTotal/$dailyLimit"
        }
        else -> {
          iconView?.text = "⏱ "
          titleView?.text = "Time: "
          counterView?.text = "${estimatedMins}m"
        }
      }
      titleView?.setTextColor(Color.parseColor("#E5E5E4"))
      counterView?.setTextColor(accent)
      backgroundDrawable?.setStroke(dpToPx(2), accent)
    }
  }

  private fun launchReelCountApp() {
    try {
      val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      }
      if (intent != null) {
        Toast.makeText(context, "🎬 Opening ReelCount Dashboard...", Toast.LENGTH_SHORT).show()
        context.startActivity(intent)
      }
    } catch (_: Exception) {}
  }

  private fun triggerHaptic(durationMs: Long) {
    try {
      val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vm?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        vibrator?.vibrate(durationMs)
      }
    } catch (_: Exception) {}
  }

  fun hide() {
    handler.post {
      if (isVisible) {
        hudView?.visibility = View.GONE
        isVisible = false
      }
    }
  }

  fun destroy() {
    handler.post {
      if (isAttached && hudView != null) {
        try {
          windowManager?.removeView(hudView)
        } catch (_: Exception) {}
        isAttached = false
        isVisible = false
      }
    }
  }

  private fun ensureAttached() {
    if (hudView == null) {
      setupView()
    }
    if (!isAttached && hudView != null && windowManager != null) {
      try {
        windowManager.addView(hudView, layoutParams)
        isAttached = true
      } catch (_: Exception) {}
    }
  }

  private fun pulse(isWarning: Boolean = false) {
    val view = hudView ?: return
    try {
      if (isWarning || isCurrentLimitReached) {
        // Double heartbeat pulse for limit alert
        val scaleX = PropertyValuesHolder.ofFloat(View.SCALE_X, 1.0f, 1.25f, 0.95f, 1.22f, 1.0f)
        val scaleY = PropertyValuesHolder.ofFloat(View.SCALE_Y, 1.0f, 1.25f, 0.95f, 1.22f, 1.0f)
        ObjectAnimator.ofPropertyValuesHolder(view, scaleX, scaleY).apply {
          duration = 420
          interpolator = android.view.animation.AccelerateDecelerateInterpolator()
          start()
        }
      } else {
        // Juicy, tactile spring bounce with overshoot
        val scaleX = PropertyValuesHolder.ofFloat(View.SCALE_X, 1.0f, 1.22f, 0.96f, 1.0f)
        val scaleY = PropertyValuesHolder.ofFloat(View.SCALE_Y, 1.0f, 1.22f, 0.96f, 1.0f)
        ObjectAnimator.ofPropertyValuesHolder(view, scaleX, scaleY).apply {
          duration = 280
          interpolator = android.view.animation.OvershootInterpolator(2.4f)
          start()
        }
      }
    } catch (_: Exception) {}
  }

  private fun dpToPx(dp: Int): Int {
    return TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      dp.toFloat(),
      context.resources.displayMetrics
    ).toInt()
  }
}