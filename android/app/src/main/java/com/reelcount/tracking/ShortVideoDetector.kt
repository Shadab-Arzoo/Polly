package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

internal data class DetectionResult(
  val isShortVideoActive: Boolean,
  val isCommentSection: Boolean,
  val fingerprint: String?
)

/**
 * Intelligent detector that identifies active short-form video viewers (Instagram Reels,
 * YouTube Shorts, TikTok, Snapchat Spotlight), extracts a stable fingerprint for each video item,
 * and strictly filters out comment sections, bottom sheets, and modal drawers.
 */
internal class ShortVideoDetector {

  fun detect(event: AccessibilityEvent, rootNode: AccessibilityNodeInfo?): DetectionResult {
    val packageName = event.packageName?.toString() ?: ""
    if (packageName !in TargetPackages.all) {
      return DetectionResult(isShortVideoActive = false, isCommentSection = false, fingerprint = null)
    }

    // 1. Strict comment check: if the event or active window is inside a comment thread/sheet,
    // it MUST NOT trigger reel counts.
    val isComment = isCommentInteraction(event, rootNode)
    if (isComment) {
      return DetectionResult(
        isShortVideoActive = false,
        isCommentSection = true,
        fingerprint = null
      )
    }

    // 2. Verify short video viewer is currently visible on screen
    val isShortVideo = isShortVideoViewer(event, rootNode, packageName)

    // 3. Extract distinct video fingerprint (creator / sound / caption)
    val fingerprint = if (isShortVideo) {
      extractFingerprint(event, rootNode, packageName)
    } else {
      null
    }

    return DetectionResult(
      isShortVideoActive = isShortVideo,
      isCommentSection = false,
      fingerprint = fingerprint
    )
  }

  fun isCommentInteraction(event: AccessibilityEvent, rootNode: AccessibilityNodeInfo?): Boolean {
    // Check event source
    event.source?.let { source ->
      if (nodeMatchesComment(source)) return true
    }

    // Check event text
    for (t in event.text) {
      val s = t.toString().lowercase()
      if (
        s.contains("add a comment") ||
        s == "comments" ||
        s.contains("write a comment") ||
        s.contains("add comment") ||
        s.contains("reply to") ||
        s.contains("view replies")
      ) {
        return true
      }
    }

    // Check event content description
    val contentDesc = event.contentDescription?.toString()?.lowercase() ?: ""
    if (
      contentDesc == "comments" ||
      contentDesc.contains("comment sheet") ||
      contentDesc.contains("comments list") ||
      contentDesc.contains("comment thread")
    ) {
      return true
    }

    // Check root active window if available
    if (rootNode != null) {
      return hasCommentSectionInTree(rootNode)
    }

    return false
  }

  private fun nodeMatchesComment(node: AccessibilityNodeInfo): Boolean {
    val viewId = node.viewIdResourceName?.lowercase() ?: ""
    if (
      viewId.contains("comment_thread") ||
      viewId.contains("comments_list") ||
      viewId.contains("comment_composer") ||
      viewId.contains("comment_rows") ||
      viewId.contains("comment_sheet") ||
      viewId.contains("layout_comment") ||
      viewId.contains("comment_recycler") ||
      viewId.contains("comments_recycler") ||
      viewId.contains("bottom_sheet_container")
    ) {
      return true
    }

    val text = node.text?.toString()?.lowercase() ?: ""
    if (
      text.contains("add a comment") ||
      text.contains("add comment") ||
      text == "comments" ||
      text.contains("write a comment")
    ) {
      return true
    }

    val className = node.className?.toString() ?: ""
    if (className.contains("EditText", ignoreCase = true) && (text.contains("comment") || viewId.contains("comment"))) {
      return true
    }

    return false
  }

  private fun hasCommentSectionInTree(root: AccessibilityNodeInfo): Boolean {
    var nodesChecked = 0

    fun traverse(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || nodesChecked++ > MAX_SEARCH_NODES) return false
      if (nodeMatchesComment(node)) return true

      val childCount = node.childCount
      for (i in 0 until childCount) {
        val child = node.getChild(i) ?: continue
        if (traverse(child, depth + 1)) return true
      }
      return false
    }

    return traverse(root, 0)
  }

  fun isShortVideoViewer(
    event: AccessibilityEvent,
    rootNode: AccessibilityNodeInfo?,
    packageName: String
  ): Boolean {
    val canonical = TargetPackages.getCanonicalName(packageName)

    return when (canonical) {
      TargetPackages.INSTAGRAM -> {
        eventMatchesInstagramReel(event) || (rootNode != null && hasInstagramReelIndicators(rootNode))
      }
      TargetPackages.YOUTUBE -> {
        eventMatchesYouTubeShorts(event) || (rootNode != null && hasYouTubeShortsIndicators(rootNode))
      }
      TargetPackages.TIKTOK -> {
        // TikTok is primarily short-form video in its main flow
        true
      }
      TargetPackages.SNAPCHAT -> {
        eventMatchesSnapchatSpotlight(event) || (rootNode != null && hasSnapchatSpotlightIndicators(rootNode))
      }
      else -> false
    }
  }

  private fun eventMatchesInstagramReel(event: AccessibilityEvent): Boolean {
    val resName = event.source?.viewIdResourceName?.lowercase() ?: ""
    if (resName.contains("clips") || resName.contains("reel")) return true

    val desc = event.contentDescription?.toString()?.lowercase() ?: ""
    if (desc.contains("reel") || desc.contains("original audio") || desc.contains("audio")) return true

    return false
  }

  private fun hasInstagramReelIndicators(root: AccessibilityNodeInfo): Boolean {
    // Fast path: common reels audio / tags
    if (root.findAccessibilityNodeInfosByText("Original audio").isNotEmpty()) return true
    if (root.findAccessibilityNodeInfosByText("Audio").isNotEmpty()) return true
    if (root.findAccessibilityNodeInfosByText("Reels").isNotEmpty()) return true

    var count = 0
    fun check(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || count++ > MAX_SEARCH_NODES) return false
      val id = node.viewIdResourceName?.lowercase() ?: ""
      if (
        id.contains("clips_viewer") ||
        id.contains("clips_video") ||
        id.contains("reel_viewer") ||
        id.contains("clips_pager") ||
        id.contains("clips_author") ||
        id.contains("clips_swipe_refresh")
      ) {
        return true
      }
      val desc = node.contentDescription?.toString()?.lowercase() ?: ""
      if (desc.contains("like reel") || desc.contains("reel by") || desc.contains("remix")) {
        return true
      }
      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        if (check(child, depth + 1)) return true
      }
      return false
    }
    return check(root, 0)
  }

  private fun eventMatchesYouTubeShorts(event: AccessibilityEvent): Boolean {
    val res = event.source?.viewIdResourceName?.lowercase() ?: ""
    if (res.contains("reel") || res.contains("shorts")) return true
    val desc = event.contentDescription?.toString()?.lowercase() ?: ""
    return desc.contains("shorts") || desc.contains("remix")
  }

  private fun hasYouTubeShortsIndicators(root: AccessibilityNodeInfo): Boolean {
    if (root.findAccessibilityNodeInfosByText("Shorts").isNotEmpty()) return true
    if (root.findAccessibilityNodeInfosByText("Remix").isNotEmpty()) return true

    var count = 0
    fun check(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || count++ > MAX_SEARCH_NODES) return false
      val id = node.viewIdResourceName?.lowercase() ?: ""
      if (id.contains("reel_player") || id.contains("shorts_container") || id.contains("reel_watch")) {
        return true
      }
      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        if (check(child, depth + 1)) return true
      }
      return false
    }
    return check(root, 0)
  }

  private fun eventMatchesSnapchatSpotlight(event: AccessibilityEvent): Boolean {
    val res = event.source?.viewIdResourceName?.lowercase() ?: ""
    return res.contains("spotlight")
  }

  private fun hasSnapchatSpotlightIndicators(root: AccessibilityNodeInfo): Boolean {
    if (root.findAccessibilityNodeInfosByText("Spotlight").isNotEmpty()) return true
    return false
  }

  fun extractFingerprint(
    event: AccessibilityEvent,
    rootNode: AccessibilityNodeInfo?,
    packageName: String
  ): String? {
    if (rootNode == null) {
      val desc = event.contentDescription?.toString()?.trim()
      if (!desc.isNullOrEmpty() && desc.length in 4..120) return "$packageName:$desc"
      val text = event.text?.joinToString(" ")?.trim()
      if (!text.isNullOrEmpty() && text.length in 4..120) return "$packageName:$text"
      return null
    }

    val extractedTexts = mutableListOf<String>()
    var nodesInspected = 0

    fun collectTexts(node: AccessibilityNodeInfo?, depth: Int) {
      if (node == null || depth > MAX_SEARCH_DEPTH || nodesInspected++ > MAX_SEARCH_NODES) return
      if (nodeMatchesComment(node)) return

      val text = node.text?.toString()?.trim()
      if (!text.isNullOrEmpty() && text.length in 3..140) {
        val lower = text.lowercase()
        if (
          lower != "like" &&
          lower != "comment" &&
          lower != "share" &&
          lower != "remix" &&
          lower != "save" &&
          lower != "follow" &&
          lower != "audio" &&
          lower != "more" &&
          lower != "subscribe" &&
          lower != "send"
        ) {
          extractedTexts.add(text)
        }
      }

      val desc = node.contentDescription?.toString()?.trim()
      if (!desc.isNullOrEmpty() && desc.length in 4..140) {
        val lowerDesc = desc.lowercase()
        if (lowerDesc.contains("reel by") || lowerDesc.contains("audio") || lowerDesc.contains("profile picture")) {
          extractedTexts.add(desc)
        }
      }

      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        collectTexts(child, depth + 1)
      }
    }

    collectTexts(rootNode, 0)

    if (extractedTexts.isEmpty()) {
      return null
    }

    return extractedTexts.take(3).joinToString("||")
  }

  private companion object {
    const val MAX_SEARCH_DEPTH = 5
    const val MAX_SEARCH_NODES = 45
  }
}
