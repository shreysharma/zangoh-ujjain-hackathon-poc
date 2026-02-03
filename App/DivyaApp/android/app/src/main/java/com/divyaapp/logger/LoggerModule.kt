package com.divyaapp.logger

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LoggerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "Logger"

  @ReactMethod
  fun log(tag: String, message: String) {
    Log.d(tag, message)
  }

  @ReactMethod
  fun warn(tag: String, message: String) {
    Log.w(tag, message)
  }

  @ReactMethod
  fun error(tag: String, message: String) {
    Log.e(tag, message)
  }
}
