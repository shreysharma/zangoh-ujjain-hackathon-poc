package com.divyaapp.pcm;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.content.Context;
import android.util.Base64;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PcmPlayerModule extends ReactContextBaseJavaModule {
  private static final String NAME = "PcmPlayer";
  private static final String TAG = "PcmPlayer";
  private AudioTrack audioTrack = null;
  private int sampleRate = 24000;
  private boolean usingVoiceUsage = false;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private Runnable usageFallbackRunnable = null;
  private int lastPlaybackHead = 0;
  private int recoveryToken = 0;
  private Runnable recoverRunnable = null;
  private Integer prevMusicVolume = null;
  private Integer prevCallVolume = null;

  public PcmPlayerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    PcmPlayerModuleHolder.INSTANCE = this;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void init(int sampleRate, @Nullable Promise promise) {
    this.sampleRate = sampleRate > 0 ? sampleRate : 24000;
    releaseInternal();
    AudioManager audioManager = (AudioManager) getReactApplicationContext()
      .getSystemService(Context.AUDIO_SERVICE);
    if (audioManager != null) {
      audioManager.setMode(usingVoiceUsage
        ? AudioManager.MODE_IN_COMMUNICATION
        : AudioManager.MODE_NORMAL);
      audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
      audioManager.setSpeakerphoneOn(true);
      if (prevMusicVolume == null) {
        prevMusicVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
      }
      if (prevCallVolume == null) {
        prevCallVolume = audioManager.getStreamVolume(AudioManager.STREAM_VOICE_CALL);
      }
      int maxMusic = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
      int maxCall = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
      int targetMusic = Math.max(1, Math.round(maxMusic * 0.7f));
      int targetCall = Math.max(1, Math.round(maxCall * 0.7f));
      audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetMusic, 0);
      audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, targetCall, 0);
      Log.d(TAG, "force volume music=" + maxMusic + " call=" + maxCall);
    }
    int minBuf = AudioTrack.getMinBufferSize(
      this.sampleRate,
      AudioFormat.CHANNEL_OUT_MONO,
      AudioFormat.ENCODING_PCM_16BIT
    );
    int bufferSize = Math.max(minBuf, this.sampleRate); // at least ~1s buffer
    audioTrack = buildTrack(bufferSize);
    audioTrack.setVolume(1.0f);
    audioTrack.play();
    Log.d(TAG, "init sampleRate=" + this.sampleRate + " bufferSize=" + bufferSize + " usage=" + (usingVoiceUsage ? "VOICE" : "MEDIA"));
    if (promise != null) promise.resolve(null);
  }

  private AudioTrack buildTrack(int bufferSize) {
    int usage = usingVoiceUsage ? AudioAttributes.USAGE_VOICE_COMMUNICATION : AudioAttributes.USAGE_MEDIA;
    return new AudioTrack.Builder()
      .setAudioAttributes(
        new AudioAttributes.Builder()
          .setUsage(usage)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build()
      )
      .setAudioFormat(
        new AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .setSampleRate(this.sampleRate)
          .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
          .build()
      )
      .setTransferMode(AudioTrack.MODE_STREAM)
      .setBufferSizeInBytes(bufferSize)
      .build();
  }

  @ReactMethod
  public void writeBase64(String base64, @Nullable Promise promise) {
    try {
      if (audioTrack == null) init(this.sampleRate, null);
      if (audioTrack == null) {
        if (promise != null) promise.reject("E_NO_TRACK", "AudioTrack not initialized");
        return;
      }
      Log.d(TAG, "writeBase64 len=" + (base64 != null ? base64.length() : 0));
      byte[] pcm = Base64.decode(base64, Base64.NO_WRAP);
      // Compute RMS for debug.
      int sampleCount = pcm.length / 2;
      long sumSquares = 0;
      for (int i = 0; i < sampleCount; i++) {
        int lo = pcm[i * 2] & 0xFF;
        int hi = pcm[i * 2 + 1];
        short sample = (short) ((hi << 8) | lo);
        sumSquares += (long) sample * (long) sample;
      }
      if (sampleCount > 0) {
        double rms = Math.sqrt(sumSquares / (double) sampleCount);
        Log.d(TAG, "write bytes=" + pcm.length + " rms=" + Math.round(rms));
      } else {
        Log.d(TAG, "write bytes=" + pcm.length);
      }
      audioTrack.write(pcm, 0, pcm.length);
      scheduleSilentRecovery();
      // Always use media route; no fallback needed.
      if (promise != null) promise.resolve(null);
    } catch (Exception e) {
      if (promise != null) promise.reject("E_WRITE", e);
    }
  }

  private void scheduleUsageFallback() {
    if (!usingVoiceUsage) return;
    if (usageFallbackRunnable != null) {
      mainHandler.removeCallbacks(usageFallbackRunnable);
      usageFallbackRunnable = null;
    }
    final AudioTrack trackSnapshot = audioTrack;
    final int headAtSchedule = trackSnapshot != null ? trackSnapshot.getPlaybackHeadPosition() : 0;
    usageFallbackRunnable = new Runnable() {
      @Override
      public void run() {
        if (!usingVoiceUsage) return;
        int headNow = trackSnapshot != null ? trackSnapshot.getPlaybackHeadPosition() : 0;
        if (headNow > headAtSchedule) {
          Log.d(TAG, "playback active, skip fallback");
          return;
        }
        Log.w(TAG, "fallback to USAGE_MEDIA");
        usingVoiceUsage = false;
        try {
          init(sampleRate, null);
        } catch (Exception ignored) {}
      }
    };
    mainHandler.postDelayed(usageFallbackRunnable, 2000);
  }

  private void scheduleSilentRecovery() {
    if (audioTrack == null) return;
    if (recoverRunnable != null) {
      mainHandler.removeCallbacks(recoverRunnable);
      recoverRunnable = null;
    }
    final AudioTrack trackSnapshot = audioTrack;
    final int headAtWrite = trackSnapshot != null ? trackSnapshot.getPlaybackHeadPosition() : 0;
    final int token = ++recoveryToken;
    recoverRunnable = new Runnable() {
      @Override
      public void run() {
        if (token != recoveryToken) return;
        if (trackSnapshot == null) return;
        int headNow = trackSnapshot.getPlaybackHeadPosition();
        if (headNow > headAtWrite) {
          Log.d(TAG, "playback active, skip recovery");
          return;
        }
        Log.w(TAG, "playback stalled, reinit");
        try {
          init(sampleRate, null);
        } catch (Exception ignored) {}
      }
    };
    mainHandler.postDelayed(recoverRunnable, 1000);
  }

  @ReactMethod
  public void playTestTone(@Nullable Promise promise) {
    try {
      if (audioTrack == null) init(this.sampleRate, null);
      if (audioTrack == null) {
        if (promise != null) promise.reject("E_NO_TRACK", "AudioTrack not initialized");
        return;
      }
      int durationMs = 1000;
      int sampleCount = (this.sampleRate * durationMs) / 1000;
      byte[] pcm = new byte[sampleCount * 2];
      double freq = 440.0;
      for (int i = 0; i < sampleCount; i++) {
        double t = i / (double) this.sampleRate;
        short sample = (short) (Math.sin(2.0 * Math.PI * freq * t) * 0.3 * Short.MAX_VALUE);
        pcm[i * 2] = (byte) (sample & 0xFF);
        pcm[i * 2 + 1] = (byte) ((sample >> 8) & 0xFF);
      }
      audioTrack.write(pcm, 0, pcm.length);
      Log.d(TAG, "test tone played");
      if (promise != null) promise.resolve(null);
    } catch (Exception e) {
      if (promise != null) promise.reject("E_TONE", e);
    }
  }

  @ReactMethod
  public void stop(@Nullable Promise promise) {
    restoreVolumes();
    if (audioTrack != null) {
      try {
        audioTrack.pause();
        audioTrack.flush();
      } catch (Exception ignored) {}
    }
    if (promise != null) promise.resolve(null);
  }

  @ReactMethod
  public void release(@Nullable Promise promise) {
    restoreVolumes();
    releaseInternal();
    if (promise != null) promise.resolve(null);
  }

  private void releaseInternal() {
    if (audioTrack != null) {
      try {
        audioTrack.stop();
      } catch (Exception ignored) {}
      try {
        audioTrack.release();
      } catch (Exception ignored) {}
      audioTrack = null;
    }
    restoreVolumes();
    if (usageFallbackRunnable != null) {
      mainHandler.removeCallbacks(usageFallbackRunnable);
      usageFallbackRunnable = null;
    }
    if (recoverRunnable != null) {
      mainHandler.removeCallbacks(recoverRunnable);
      recoverRunnable = null;
    }
  }

  private void restoreVolumes() {
    AudioManager audioManager = (AudioManager) getReactApplicationContext()
      .getSystemService(Context.AUDIO_SERVICE);
    if (audioManager == null) return;
    if (prevMusicVolume != null) {
      audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, prevMusicVolume, 0);
      prevMusicVolume = null;
    }
    if (prevCallVolume != null) {
      audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, prevCallVolume, 0);
      prevCallVolume = null;
    }
  }

  @Override
  public void invalidate() {
    super.invalidate();
    releaseInternal();
    if (PcmPlayerModuleHolder.INSTANCE == this) {
      PcmPlayerModuleHolder.INSTANCE = null;
    }
  }
}
