package com.divyaapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.divyaapp.pcm.PcmPlayerPackage
import com.divyaapp.text.TextBufferPackage
import com.divyaapp.ws.NativeWSPackage
import com.divyaapp.image.ImageCompressPackage
import com.divyaapp.logger.LoggerPackage
import com.divyaapp.mic.NativeMicPackage
import com.divyaapp.network.NativeOfflineBannerPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(PcmPlayerPackage())
          add(TextBufferPackage())
          add(NativeWSPackage())
          add(ImageCompressPackage())
          add(LoggerPackage())
          add(NativeMicPackage())
          add(NativeOfflineBannerPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
