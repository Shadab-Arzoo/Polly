package com.reelcount.tracking

import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

/**
 * On-screen floating HUD overlay that displays live scroll counts
 * over supported short-form video applications using TYPE_ACCESSIBILITY_OVERLAY.
 */
class ReelCountOverlayHud(private val context: Context) {
  private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private var hudView: LinearLayout? = null
  private var titleView: TextView? = null
  private var counterView: TextView? = null
  private var isAttached = false
  private var isVisible = false

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
    x = dpToPx(16)
    y = dpToPx(72)
  }

  init {
    handler.post { setupView() }
  }

  private fun setupView() {
    if (hudView != null) return

    val container = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      val padH = dpToPx(14)
      val padV = dpToPx(8)
      setPadding(padH, padV, padH, padV)

      val background = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = dpToPx(24).toFloat()
        setColor(Color.parseColor("#E60F1715"))
        setStroke(dpToPx(2), Color.parseColor("#38D39F"))
      }
      this.background = background
      elevation = dpToPx(8).toFloat()
    }

    val iconView = TextView(context).apply {
      text = "🎬 "
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
    }

    val title = TextView(context).apply {
      text = "Shorts: "
      setTextColor(Color.parseColor("#B0C2B8"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    val counter = TextView(context).apply {
      text = "0"
      setTextColor(Color.parseColor("#38D39F"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    container.addView(iconView)
    container.addView(title)
    container.addView(counter)

    // Make floating pill draggable across the screen
    var initialX = 0
    var initialY = 0
    var touchStartX = 0f
    var touchStartY = 0f

    container.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = layoutParams.x
          initialY = layoutParams.y
          touchStartX = event.rawX
          touchStartY = event.rawY
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
        else -> false
      }
    }

    hudView = container
    titleView = title
    counterView = counter
  }

  fun show(appLabel: String, count: Int) {
    handler.post {
      ensureAttached()
      val shortLabel = when {
        appLabel.contains("Instagram", ignoreCase = true) -> "Reels"
        appLabel.contains("TikTok", ignoreCase = true) -> "TikTok"
        appLabel.contains("YouTube", ignoreCase = true) -> "Shorts"
        appLabel.contains("Snapchat", ignoreCase = true) -> "Spotlight"
        else -> "Shorts"
      }
      titleView?.text = "$shortLabel: "
      counterView?.text = "$count"
      hudView?.visibility = View.VISIBLE
      isVisible = true
      pulse()
    }
  }

  fun updateCount(appLabel: String, count: Int) {
    handler.post {
      ensureAttached()
      val shortLabel = when {
        appLabel.contains("Instagram", ignoreCase = true) -> "Reels"
        appLabel.contains("TikTok", ignoreCase = true) -> "TikTok"
        appLabel.contains("YouTube", ignoreCase = true) -> "Shorts"
        appLabel.contains("Snapchat", ignoreCase = true) -> "Spotlight"
        else -> "Shorts"
      }
      titleView?.text = "$shortLabel: "
      counterView?.text = "$count"
      hudView?.visibility = View.VISIBLE
      isVisible = true
      pulse()
    }
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

  private fun pulse() {
    val view = hudView ?: return
    try {
      val scaleX = PropertyValuesHolder.ofFloat(View.SCALE_X, 1.0f, 1.2f, 1.0f)
      val scaleY = PropertyValuesHolder.ofFloat(View.SCALE_Y, 1.0f, 1.2f, 1.0f)
      ObjectAnimator.ofPropertyValuesHolder(view, scaleX, scaleY).apply {
        duration = 200
        start()
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
