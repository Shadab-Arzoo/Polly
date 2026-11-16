package com.reelcount.soundscape

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import java.util.Random
import kotlin.math.PI
import kotlin.math.sin

/**
 * 100% on-device procedural audio synthesizer.
 * Generates organic soothing ambient soundscapes directly in real-time
 * using AudioTrack without requiring any large audio assets or internet downloads.
 *
 * Soundscapes supported:
 * - 'rain': Soothing filtered pink noise with soft droplet acoustics.
 * - 'waves': Surging ocean tide with 12.5s gentle breath swell modulation.
 * - 'cosmic': 432 Hz healing harmonic drone with 4 Hz theta binaural pulse.
 * - 'forest': Ambient wind gusts and warm brown-noise resonance.
 * - 'cafe': Muffled warm acoustic murmur ambience.
 */
object ProceduralSoundscapePlayer {
  private const val SAMPLE_RATE = 22050
  private const val BUFFER_SIZE_FRAMES = 1024

  @Volatile
  private var isPlaying = false

  @Volatile
  private var currentSoundscape = "rain"

  private var audioTrack: AudioTrack? = null
  private var audioThread: Thread? = null

  @Synchronized
  fun play(soundscape: String) {
    if (isPlaying && currentSoundscape == soundscape) {
      return
    }

    stop()

    currentSoundscape = soundscape
    isPlaying = true

    val minBufSize = AudioTrack.getMinBufferSize(
      SAMPLE_RATE,
      AudioFormat.CHANNEL_OUT_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    )
    val bufferSize = Math.max(minBufSize, BUFFER_SIZE_FRAMES * 2)

    val track = AudioTrack.Builder()
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
          .build()
      )
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .setSampleRate(SAMPLE_RATE)
          .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
          .build()
      )
      .setBufferSizeInBytes(bufferSize)
      .setTransferMode(AudioTrack.MODE_STREAM)
      .build()

    audioTrack = track
    track.play()

    audioThread = Thread({
      generateAudioLoop(track, currentSoundscape)
    }, "ReelCount-SoundscapeSynthesizer").apply {
      priority = Thread.NORM_PRIORITY
      start()
    }
  }

  @Synchronized
  fun stop() {
    isPlaying = false
    try {
      audioThread?.interrupt()
      audioThread?.join(300)
    } catch (_: Exception) {}
    audioThread = null

    try {
      audioTrack?.stop()
      audioTrack?.release()
    } catch (_: Exception) {}
    audioTrack = null
  }

  fun isAudioPlaying(): Boolean = isPlaying

  fun getCurrentSoundscape(): String = currentSoundscape

  private fun generateAudioLoop(track: AudioTrack, type: String) {
    val buffer = ShortArray(BUFFER_SIZE_FRAMES)
    val random = Random()

    var sampleIndex = 0L
    var b0 = 0.0
    var b1 = 0.0
    var b2 = 0.0
    var brown = 0.0

    // Smooth volume fade-in over 2 seconds (44,100 samples)
    val fadeInSamples = SAMPLE_RATE * 2.0

    while (isPlaying && !Thread.currentThread().isInterrupted) {
      for (i in buffer.indices) {
        val t = sampleIndex.toDouble() / SAMPLE_RATE
        val white = (random.nextDouble() * 2.0) - 1.0

        // Pink noise generator (Paul Kellet's filter)
        b0 = 0.99765 * b0 + white * 0.0990460
        b1 = 0.96300 * b1 + white * 0.2965164
        b2 = 0.57000 * b2 + white * 1.0526913
        val pink = (b0 + b1 + b2 + white * 0.1848) * 0.18

        // Brown noise generator
        brown = (brown + (0.02 * white)) / 1.02

        var rawSample = when (type) {
          "waves" -> {
            // 0.08 Hz wave cycle (12.5 seconds per surge)
            val waveLfo = (sin(2.0 * PI * 0.08 * t) + 1.0) / 2.0
            (pink * 0.3 + brown * 0.4) * (0.2 + 0.8 * waveLfo)
          }
          "cosmic" -> {
            // 432 Hz pure drone + 436 Hz offset (4 Hz theta meditation wave)
            val drone1 = sin(2.0 * PI * 432.0 * t)
            val drone2 = sin(2.0 * PI * 436.0 * t)
            val droneBass = sin(2.0 * PI * 108.0 * t) * 0.4
            (drone1 * 0.35 + drone2 * 0.35 + droneBass) * 0.25
          }
          "forest" -> {
            // Organic resonant breeze with subtle wind modulation
            val breezeLfo = (sin(2.0 * PI * 0.04 * t) + 1.0) / 2.0
            brown * 0.4 * (0.3 + 0.7 * breezeLfo)
          }
          "cafe" -> {
            // Warm low-frequency filtered acoustic presence
            val murmur = (pink * 0.4 + brown * 0.5) * 0.3
            murmur
          }
          else -> { // Default: 'rain'
            // Soft rain acoustic + gentle droplets
            var drop = 0.0
            if (random.nextDouble() < 0.0015) {
              drop = (random.nextDouble() - 0.5) * 0.5
            }
            (pink * 0.5 + drop) * 0.4
          }
        }

        // Apply fade-in
        if (sampleIndex < fadeInSamples) {
          rawSample *= (sampleIndex / fadeInSamples)
        }

        val clamped = Math.max(-1.0, Math.min(1.0, rawSample))
        buffer[i] = (clamped * 32767.0).toInt().toShort()
        sampleIndex++
      }

      try {
        val written = track.write(buffer, 0, buffer.size)
        if (written < 0) break
      } catch (_: Exception) {
        break
      }
    }
  }
}
