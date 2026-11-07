package com.reelcount.tracking

/** Provisional identifiers. Verify installed package names and app versions on test devices. */
internal object TargetPackages {
  const val INSTAGRAM = "com.instagram.android"
  const val TIKTOK = "com.zhiliaoapp.musically"
  const val SNAPCHAT = "com.snapchat.android"
  const val YOUTUBE = "com.google.android.youtube"

  val all = setOf(INSTAGRAM, TIKTOK, SNAPCHAT, YOUTUBE)
}
