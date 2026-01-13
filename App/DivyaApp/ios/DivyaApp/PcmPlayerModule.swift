import AVFoundation
import React

@objc(PcmPlayer)
class PcmPlayerModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "PcmPlayer" }
  static func requiresMainQueueSetup() -> Bool { false }

  private let engine = AVAudioEngine()
  private let player = AVAudioPlayerNode()
  private var format: AVAudioFormat?
  private var sampleRate: Double = 24000
  private var isReady = false

  override init() {
    super.init()
    PcmPlayerModuleHolder.instance = self
  }

  @objc(init:promise:)
  func initPlayer(_ sampleRate: NSNumber, promise: RCTPromiseResolveBlock?) {
    self.sampleRate = sampleRate.doubleValue > 0 ? sampleRate.doubleValue : 24000
    setupEngine()
    promise?(nil)
  }

  @objc
  func writeBase64(_ base64: String, promise: RCTPromiseResolveBlock?) {
    if !isReady {
      setupEngine()
    }
    guard let format = format else {
      promise?(nil)
      return
    }
    guard let data = Data(base64Encoded: base64) else {
      promise?(nil)
      return
    }
    let frameCount = data.count / 2
    guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frameCount)) else {
      promise?(nil)
      return
    }
    buffer.frameLength = AVAudioFrameCount(frameCount)
    data.withUnsafeBytes { rawBuffer in
      if let src = rawBuffer.bindMemory(to: Int16.self).baseAddress,
         let dst = buffer.int16ChannelData {
        dst[0].assign(from: src, count: frameCount)
      }
    }
    player.scheduleBuffer(buffer, completionHandler: nil)
    if !player.isPlaying {
      player.play()
    }
    promise?(nil)
  }

  @objc
  func stop(_ promise: RCTPromiseResolveBlock?) {
    player.stop()
    promise?(nil)
  }

  @objc
  func release(_ promise: RCTPromiseResolveBlock?) {
    player.stop()
    engine.stop()
    isReady = false
    promise?(nil)
  }

  @objc
  func playTestTone(_ promise: RCTPromiseResolveBlock?) {
    if !isReady { setupEngine() }
    guard let format = format else {
      promise?(nil)
      return
    }
    let durationMs = 1000
    let frameCount = Int(sampleRate * Double(durationMs) / 1000.0)
    guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frameCount)) else {
      promise?(nil)
      return
    }
    buffer.frameLength = AVAudioFrameCount(frameCount)
    let freq = 440.0
    if let dst = buffer.int16ChannelData {
      for i in 0..<frameCount {
        let t = Double(i) / sampleRate
        let sample = Int16(sin(2.0 * Double.pi * freq * t) * 0.3 * Double(Int16.max))
        dst[0][i] = sample
      }
    }
    player.scheduleBuffer(buffer, completionHandler: nil)
    player.play()
    promise?(nil)
  }

  private func setupEngine() {
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
    try? session.setActive(true, options: [])
    format = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: sampleRate, channels: 1, interleaved: true)
    if !engine.attachedNodes.contains(player) {
      engine.attach(player)
    }
    if let format = format {
      engine.connect(player, to: engine.mainMixerNode, format: format)
    }
    if !engine.isRunning {
      try? engine.start()
    }
    isReady = true
  }
}
