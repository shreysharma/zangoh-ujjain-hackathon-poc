package com.divyaapp.ws

object NativeWSModuleHolder {
  @Volatile
  var INSTANCE: NativeWSModule? = null
  @Volatile
  var botPlaying: Boolean = false
  @Volatile
  var interruptedEmitted: Boolean = false
  @Volatile
  var dropAudioUntilTurnComplete: Boolean = false

  @JvmStatic
  fun getInstance(): NativeWSModule? = INSTANCE
}
