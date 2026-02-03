package com.divyaapp.ws

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okhttp3.logging.HttpLoggingInterceptor
import okio.ByteString
import okio.ByteString.Companion.decodeBase64
import org.json.JSONArray
import org.json.JSONObject
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.divyaapp.pcm.PcmPlayerModuleHolder
import com.divyaapp.mic.NativeMicModuleHolder

class NativeWSModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var client: OkHttpClient? = null
  private var socket: WebSocket? = null
  private val handler = Handler(Looper.getMainLooper())
  private val batch: MutableList<WritableMap> = ArrayList()
  private var batching = false
  private val batchIntervalMs = 50L
  private var nativeAudioPlaybackEnabled = false
  private val logTag = "NativeWS"
  private var needsPcmReinit = false

  init {
    NativeWSModuleHolder.INSTANCE = this
  }

  override fun getName(): String = "NativeWS"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter; no-op.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter; no-op.
  }

  @ReactMethod
  fun connect(url: String, headers: ReadableMap?) {
    disconnect()
    val headerBuilder = Headers.Builder()
    headers?.keySetIterator()?.let { iterator ->
      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()
        val value = headers.getString(key)
        if (!value.isNullOrEmpty()) {
          headerBuilder.add(key, value)
        }
      }
    }
    val request = Request.Builder()
      .url(url)
      .headers(headerBuilder.build())
      .build()
    val logging = HttpLoggingInterceptor { message ->
      Log.d(logTag, "http $message")
    }.apply {
      level = HttpLoggingInterceptor.Level.HEADERS
    }
    client = OkHttpClient.Builder()
      .addInterceptor(logging)
      .build()
    socket = client!!.newWebSocket(request, NativeWSListener())
  }

  @ReactMethod
  fun sendText(text: String) {
    socket?.send(text)
  }

  fun sendAudioBase64FromNative(base64: String) {
    val payload = JSONObject()
    payload.put("type", "audio")
    payload.put("audio_data", base64)
    socket?.send(payload.toString())
  }

  fun onNativeBargeIn(reason: String) {
    if (NativeWSModuleHolder.interruptedEmitted) return
    needsPcmReinit = true
    val map = Arguments.createMap()
    map.putString("type", "interrupted")
    map.putString("reason", reason)
    map.putDouble("timestamp", System.currentTimeMillis().toDouble())
    enqueueMessage(map)
    NativeWSModuleHolder.interruptedEmitted = true
  }

  @ReactMethod
  fun sendBinaryBase64(base64: String) {
    socket?.send(base64.decodeBase64() ?: return)
  }

  @ReactMethod
  fun setNativeAudioPlaybackEnabled(enabled: Boolean) {
    nativeAudioPlaybackEnabled = enabled
    Log.d(logTag, "native audio playback enabled=$enabled")
  }

  @ReactMethod
  fun disconnect() {
    socket?.close(1000, "client_disconnect")
    socket = null
    client?.dispatcher?.executorService?.shutdown()
    client = null
  }

  private fun emit(event: String, payload: Any?) {
    reactContext
      .getJSModule(RCTDeviceEventEmitter::class.java)
      .emit(event, payload)
  }

  private fun enqueueMessage(msg: WritableMap) {
    synchronized(batch) {
      batch.add(msg)
    }
    startBatching()
  }

  private fun startBatching() {
    if (batching) return
    batching = true
    handler.post(batchRunnable)
  }

  private val batchRunnable = object : Runnable {
    override fun run() {
      val out: WritableArray = Arguments.createArray()
      synchronized(batch) {
        batch.forEach { out.pushMap(it) }
        batch.clear()
      }
      if (out.size() > 0) {
        emit("NativeWSBatchParsed", out)
        handler.postDelayed(this, batchIntervalMs)
      } else {
        batching = false
      }
    }
  }

  private fun parseMessage(text: String): WritableMap {
    val map = Arguments.createMap()
    try {
      val obj = JSONObject(text)
      return parseMessage(obj, true)
    } catch (_: Exception) {
      map.putString("type", "unknown")
      map.putString("raw", text)
    }
    return map
  }

  private fun parseMessage(obj: JSONObject, includeAudioData: Boolean): WritableMap {
    val map = Arguments.createMap()
    val type = obj.optString("type", "unknown")
    map.putString("type", type)
    if (obj.has("text")) map.putString("text", obj.optString("text", ""))
    if (obj.has("tool")) map.putString("tool", obj.optString("tool", ""))
    if (obj.has("phase")) map.putString("phase", obj.optString("phase", ""))
    if (obj.has("label")) map.putString("label", obj.optString("label", ""))
    if (obj.has("summary")) map.putString("summary", obj.optString("summary", ""))
    if (obj.has("duration_ms")) map.putInt("duration_ms", obj.optInt("duration_ms"))
    if (includeAudioData && obj.has("audio_data")) {
      map.putString("audio_data", obj.optString("audio_data", ""))
    }
    if (obj.has("chunk_number")) map.putInt("chunk_number", obj.optInt("chunk_number"))
    if (obj.has("chunk_size")) map.putInt("chunk_size", obj.optInt("chunk_size"))
    if (obj.has("mime_type")) map.putString("mime_type", obj.optString("mime_type", ""))
    if (obj.has("error")) map.putString("error", obj.optString("error", ""))
    if (obj.has("data")) {
      val data = obj.opt("data")
      when (data) {
        is JSONObject -> map.putMap("data", jsonToMap(data))
        is JSONArray -> map.putArray("data", jsonToArray(data))
        else -> map.putString("data", data?.toString() ?: "")
      }
    }
    return map
  }

  private fun jsonToMap(obj: JSONObject): WritableMap {
    val map = Arguments.createMap()
    val keys = obj.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = obj.opt(key)
      when (value) {
        is JSONObject -> map.putMap(key, jsonToMap(value))
        is JSONArray -> map.putArray(key, jsonToArray(value))
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
        is Long -> map.putDouble(key, value.toDouble())
        is Double -> map.putDouble(key, value)
        else -> map.putString(key, value?.toString() ?: "")
      }
    }
    return map
  }

  private fun jsonToArray(arr: JSONArray): WritableArray {
    val array = Arguments.createArray()
    for (i in 0 until arr.length()) {
      val value = arr.opt(i)
      when (value) {
        is JSONObject -> array.pushMap(jsonToMap(value))
        is JSONArray -> array.pushArray(jsonToArray(value))
        is Boolean -> array.pushBoolean(value)
        is Int -> array.pushInt(value)
        is Long -> array.pushDouble(value.toDouble())
        is Double -> array.pushDouble(value)
        else -> array.pushString(value?.toString() ?: "")
      }
    }
    return array
  }

  private inner class NativeWSListener : WebSocketListener() {
    private fun logStreamEvent(type: String, obj: JSONObject) {
      when (type) {
        "audio_chunk" -> {
          val chunkNum = obj.optInt("chunk_number", -1)
          val chunkSize = obj.optInt("chunk_size", -1)
          val mimeType = obj.optString("mime_type", "")
          Log.d(logTag, "event audio_chunk chunk=$chunkNum size=$chunkSize mime=$mimeType")
        }
        "input_transcription", "output_transcription", "text_chunk" -> {
          val text = obj.optString("text", "")
          Log.d(logTag, "event $type text_len=${text.length}")
        }
        "tool_call_start", "tool_call_complete", "itinerary", "connected",
        "setup_complete", "turn_complete", "pong", "error", "interrupted" -> {
          Log.d(logTag, "event $type")
        }
        else -> {
          Log.d(logTag, "event $type")
        }
      }
    }

    override fun onOpen(webSocket: WebSocket, response: Response) {
      emit("NativeWSOpen", null)
    }

    override fun onMessage(webSocket: WebSocket, text: String) {
      val obj = JSONObject(text)
      val type = obj.optString("type", "unknown")
      logStreamEvent(type, obj)
      if (type == "interrupted" && nativeAudioPlaybackEnabled) {
        val pcmModule = PcmPlayerModuleHolder.getInstance()
        pcmModule?.stop(null)
        needsPcmReinit = true
        Log.w(logTag, "interrupted: stopping playback and marking reinit")
        NativeWSModuleHolder.botPlaying = false
        NativeWSModuleHolder.dropAudioUntilTurnComplete = true
      }
      if (type == "turn_complete") {
        NativeWSModuleHolder.botPlaying = false
        NativeWSModuleHolder.interruptedEmitted = false
        NativeWSModuleHolder.dropAudioUntilTurnComplete = false
      }
      if (type == "input_transcription" && NativeWSModuleHolder.botPlaying) {
        val pcmModule = PcmPlayerModuleHolder.getInstance()
        pcmModule?.stop(null)
        needsPcmReinit = true
        NativeWSModuleHolder.botPlaying = false
        NativeWSModuleHolder.dropAudioUntilTurnComplete = true
        Log.w(logTag, "input_transcription: stopping playback for new user turn")
      }
      if (type == "audio_chunk" && nativeAudioPlaybackEnabled) {
        NativeWSModuleHolder.botPlaying = true
        if (NativeWSModuleHolder.dropAudioUntilTurnComplete) {
          val parsed = parseMessage(obj, false)
          enqueueMessage(parsed)
          return
        }
        val audioData = obj.optString("audio_data", "")
        val mimeType = obj.optString("mime_type", "")
        val rateMatch = Regex("rate=(\\d+)").find(mimeType)
        val rate = rateMatch?.groups?.get(1)?.value?.toIntOrNull()
        if (audioData.isNotEmpty()) {
          val pcmModule = PcmPlayerModuleHolder.getInstance()
          if (needsPcmReinit || rate != null) {
            pcmModule?.init(rate ?: 24000, null)
            needsPcmReinit = false
          }
          if (pcmModule == null) {
            Log.w(logTag, "pcm module missing; cannot play audio")
          } else {
            Log.d(logTag, "writing audio_chunk bytes=${audioData.length}")
            pcmModule.writeBase64(audioData, null)
            Log.d(logTag, "played audio_chunk bytes=${audioData.length}")
          }
        }
        val parsed = parseMessage(obj, false)
        enqueueMessage(parsed)
        return
      }
      val parsed = parseMessage(obj, true)
      if (type == "output_transcription") {
        emit("NativeWSParsedImmediate", parsed)
        return
      }
      enqueueMessage(parsed)
    }

    override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
      emit("NativeWSBinary", bytes.base64())
    }

    override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
      val payload = Arguments.createMap()
      payload.putInt("code", code)
      payload.putString("reason", reason)
      emit("NativeWSClose", payload)
    }

    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
      val payload = Arguments.createMap()
      payload.putInt("code", code)
      payload.putString("reason", reason)
      emit("NativeWSClose", payload)
    }

    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
      val payload = Arguments.createMap()
      payload.putString("message", t.message ?: "native_ws_error")
      payload.putString("cause", t.cause?.message ?: "")
      emit("NativeWSError", payload)
    }
  }
}
