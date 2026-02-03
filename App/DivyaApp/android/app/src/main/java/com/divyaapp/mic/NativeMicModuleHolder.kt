package com.divyaapp.mic

object NativeMicModuleHolder {
  @Volatile
  var INSTANCE: NativeMicModule? = null

  @JvmStatic
  fun getInstance(): NativeMicModule? = INSTANCE
}
