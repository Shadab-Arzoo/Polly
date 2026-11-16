package com.reelcount.tracking

/** Supported short-video application package identifiers across standard, regional, and lite editions. */
internal object TargetPackages {
  const val INSTAGRAM = "com.instagram.android"
  const val INSTAGRAM_LITE = "com.instagram.lite"
  const val TIKTOK = "com.zhiliaoapp.musically"
  const val TIKTOK_TRILL = "com.ss.android.ugc.trill"
  const val TIKTOK_LITE = "com.zhiliaoapp.musically.go"
  const val SNAPCHAT = "com.snapchat.android"
  const val YOUTUBE = "com.google.android.youtube"

  val all = setOf(
    INSTAGRAM,
    INSTAGRAM_LITE,
    TIKTOK,
    TIKTOK_TRILL,
    TIKTOK_LITE,
    SNAPCHAT,
    YOUTUBE
  )

  fun getCanonicalName(packageName: String): String {
    return when (packageName) {
      INSTAGRAM, INSTAGRAM_LITE -> INSTAGRAM
      TIKTOK, TIKTOK_TRILL, TIKTOK_LITE -> TIKTOK
      SNAPCHAT -> SNAPCHAT
      YOUTUBE -> YOUTUBE
      else -> packageName
    }
  }

  fun getDisplayLabel(packageName: String): String {
    return when (packageName) {
      INSTAGRAM, INSTAGRAM_LITE -> "Instagram Reels"
      TIKTOK, TIKTOK_TRILL, TIKTOK_LITE -> "TikTok"
      SNAPCHAT -> "Snapchat Spotlight"
      YOUTUBE -> "YouTube Shorts"
      else -> "Shorts"
    }
  }

  fun getShortBadgeLabel(packageName: String): String {
    return when (packageName) {
      INSTAGRAM, INSTAGRAM_LITE -> "Reels"
      TIKTOK, TIKTOK_TRILL, TIKTOK_LITE -> "TikTok"
      SNAPCHAT -> "Spotlight"
      YOUTUBE -> "Shorts"
      else -> "Shorts"
    }
  }
}
