package com.divyaapp.pcm;

public class PcmPlayerModuleHolder {
  public static PcmPlayerModule INSTANCE = null;

  public static PcmPlayerModule getInstance() {
    return INSTANCE;
  }
}
