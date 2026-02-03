package com.divyaapp.text

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

class TextBufferModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val handler = Handler(Looper.getMainLooper())
  private val buffer = StringBuilder()
  private var ticking = false
  private var lastEmitted = ""
  private val intervalMs = 50L

  override fun getName(): String = "TextBuffer"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter compliance.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter compliance.
  }

  @ReactMethod
  fun add(text: String?) {
    if (text.isNullOrEmpty()) return
    synchronized(buffer) {
      buffer.append(text)
    }
    startTicking()
  }

  @ReactMethod
  fun reset() {
    synchronized(buffer) {
      buffer.setLength(0)
    }
    lastEmitted = ""
  }

  private fun startTicking() {
    if (ticking) return
    ticking = true
    handler.post(tickRunnable)
  }

  private val tickRunnable = object : Runnable {
    override fun run() {
      val current = synchronized(buffer) { buffer.toString() }
      if (current != lastEmitted) {
        emitUpdate(current)
        lastEmitted = current
      }
      if (current.isNotEmpty()) {
        handler.postDelayed(this, intervalMs)
      } else {
        ticking = false
      }
    }
  }

  private fun emitUpdate(text: String) {
    reactContext
      .getJSModule(RCTDeviceEventEmitter::class.java)
      .emit("TextBufferUpdate", text)
  }
}
