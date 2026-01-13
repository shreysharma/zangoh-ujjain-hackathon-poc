package com.divyaapp.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.divyaapp.R
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeOfflineBannerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val logTag = "NativeOfflineBanner"
  private val mainHandler = Handler(Looper.getMainLooper())
  private var connectivityManager: ConnectivityManager? = null
  private var networkCallback: ConnectivityManager.NetworkCallback? = null
  private var bannerView: TextView? = null
  private var started = false

  override fun getName(): String = "NativeOfflineBanner"

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
    if (started) {
      promise?.resolve(null)
      return
    }
    started = true
    connectivityManager =
      reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val callback =
      object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
          updateBannerVisibility(isOnline())
        }

        override fun onLost(network: Network) {
          updateBannerVisibility(isOnline())
        }
      }
    networkCallback = callback
    try {
      val request = NetworkRequest.Builder().build()
      connectivityManager?.registerNetworkCallback(request, callback)
    } catch (e: Exception) {
      Log.w(logTag, "registerNetworkCallback failed: ${e.message}")
    }
    updateBannerVisibility(isOnline())
    promise?.resolve(null)
  }

  @ReactMethod
  fun stop(promise: Promise?) {
    started = false
    try {
      networkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
    } catch (_: Exception) {}
    networkCallback = null
    mainHandler.post {
      bannerView?.let { view ->
        val parent = view.parent as? ViewGroup
        parent?.removeView(view)
      }
      bannerView = null
    }
    promise?.resolve(null)
  }

  private fun isOnline(): Boolean {
    val cm = connectivityManager ?: return true
    val network = cm.activeNetwork ?: return false
    val caps = cm.getNetworkCapabilities(network) ?: return false
    return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
  }

  private fun updateBannerVisibility(online: Boolean) {
    mainHandler.post {
      val activity = reactContext.currentActivity ?: return@post
      val root = activity.findViewById<ViewGroup>(android.R.id.content) ?: return@post
      val banner = bannerView ?: createBanner(root).also { bannerView = it }
      banner.visibility = if (online) View.GONE else View.VISIBLE
      Log.d(logTag, "online=$online")
    }
  }

  private fun createBanner(root: ViewGroup): TextView {
    val banner = TextView(root.context)
    banner.text = "No internet connection"
    banner.setTextColor(ContextCompat.getColor(root.context, android.R.color.white))
    banner.setBackgroundColor(ContextCompat.getColor(root.context, android.R.color.holo_red_dark))
    banner.textSize = 14f
    banner.gravity = Gravity.CENTER
    val density = root.resources.displayMetrics.density
    val padding = (10 * density).toInt()
    banner.setPadding(padding, padding, padding, padding)
    val height = (36 * density).toInt()
    banner.maxWidth = (300 * density).toInt()
    val params = FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.WRAP_CONTENT,
      height
    ).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      topMargin = (12 * density).toInt()
    }
    banner.layoutParams = params
    banner.elevation = 8f * density
    banner.visibility = View.GONE
    root.addView(banner)
    return banner
  }

  override fun invalidate() {
    super.invalidate()
    stop(null)
  }
}
