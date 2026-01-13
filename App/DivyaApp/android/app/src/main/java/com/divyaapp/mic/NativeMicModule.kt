package com.divyaapp.mic

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Base64
import android.util.Log
import com.divyaapp.ws.NativeWSModuleHolder
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.atomic.AtomicBoolean

class NativeMicModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val logTag = "NativeMic"
  private val sampleRate = 16000
  private val channelConfig = AudioFormat.CHANNEL_IN_MONO
  private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
  private val audioSource = MediaRecorder.AudioSource.VOICE_COMMUNICATION

  private var audioRecord: AudioRecord? = null
  private val isRecording = AtomicBoolean(false)
  private var recordThread: Thread? = null

  private var sendSuppressed = false

  init {
    NativeMicModuleHolder.INSTANCE = this
  }

  override fun getName(): String = "NativeMic"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter; no-op.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter; no-op.
  }

  @ReactMethod
  fun start(promise: Promise?) {
    if (isRecording.get()) {
      promise?.resolve(null)
      return
    }
    val minBuf = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
    if (minBuf == AudioRecord.ERROR || minBuf == AudioRecord.ERROR_BAD_VALUE) {
      promise?.reject("E_AUDIO_RECORD", "Invalid buffer size")
      return
    }
    audioRecord = AudioRecord(
      audioSource,
      sampleRate,
      channelConfig,
      audioFormat,
      minBuf * 2
    )
    if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
      promise?.reject("E_AUDIO_RECORD", "AudioRecord init failed")
      audioRecord?.release()
      audioRecord = null
      return
    }
    isRecording.set(true)
    audioRecord?.startRecording()
    recordThread = Thread({ readLoop(minBuf) }, "NativeMicThread")
    recordThread?.start()
    Log.d(logTag, "recording started")
    promise?.resolve(null)
  }

  @ReactMethod
  fun stop(promise: Promise?) {
    isRecording.set(false)
    try {
      recordThread?.join(500)
    } catch (_: InterruptedException) {}
    recordThread = null
    try {
      audioRecord?.stop()
    } catch (_: Exception) {}
    try {
      audioRecord?.release()
    } catch (_: Exception) {}
    audioRecord = null
    Log.d(logTag, "recording stopped")
    promise?.resolve(null)
  }

  @ReactMethod
  fun setSendSuppressed(suppressed: Boolean) {
    sendSuppressed = false
    Log.d(logTag, "sendSuppressed=false (ignored)")
  }

  @ReactMethod
  fun setVadConfig(threshold: Int, onFrames: Int, offFrames: Int) {
    Log.d(logTag, "vadConfig ignored (VAD disabled)")
  }

  private fun readLoop(bufferSize: Int) {
    val buffer = ShortArray(bufferSize)
    while (isRecording.get()) {
      val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
      if (read <= 0) continue

      val bytes = ByteArray(read * 2)
      for (i in 0 until read) {
        val sample = buffer[i]
        bytes[i * 2] = (sample.toInt() and 0xFF).toByte()
        bytes[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
      }
      val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
      NativeWSModuleHolder.getInstance()?.sendAudioBase64FromNative(base64)
      Log.d(logTag, "sent audio bytes=${bytes.size} rms=${computeRms(buffer, read)}")
    }
  }

  private fun computeRms(buffer: ShortArray, count: Int): Int {
    var sumSquares = 0.0
    for (i in 0 until count) {
      val sample = buffer[i].toDouble()
      sumSquares += sample * sample
    }
    if (count == 0) return 0
    return Math.sqrt(sumSquares / count).toInt()
  }
}
