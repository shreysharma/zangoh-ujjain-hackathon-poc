package com.divyaapp.image

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream

class ImageCompressModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ImageCompress"

  @ReactMethod
  fun compressBase64(
    base64: String,
    quality: Int,
    maxWidth: Int,
    maxHeight: Int,
    promise: Promise
  ) {
    try {
      val decoded = Base64.decode(base64, Base64.DEFAULT)
      val bitmap = BitmapFactory.decodeByteArray(decoded, 0, decoded.size)
        ?: run {
          promise.reject("decode_failed", "Failed to decode image")
          return
        }
      val scaled = scaleBitmap(bitmap, maxWidth, maxHeight)
      val output = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.JPEG, quality, output)
      val outBytes = output.toByteArray()
      val encoded = Base64.encodeToString(outBytes, Base64.NO_WRAP)
      promise.resolve(encoded)
    } catch (e: Exception) {
      promise.reject("compress_failed", e.message)
    }
  }

  private fun scaleBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
    if (maxWidth <= 0 || maxHeight <= 0) return bitmap
    val width = bitmap.width
    val height = bitmap.height
    val scale = minOf(maxWidth.toFloat() / width, maxHeight.toFloat() / height, 1f)
    if (scale >= 1f) return bitmap
    val newW = (width * scale).toInt()
    val newH = (height * scale).toInt()
    return Bitmap.createScaledBitmap(bitmap, newW, newH, true)
  }
}
