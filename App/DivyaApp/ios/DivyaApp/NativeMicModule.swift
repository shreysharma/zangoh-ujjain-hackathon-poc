import AVFoundation
import React

@objc(NativeMic)
class NativeMicModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "NativeMic" }
  static func requiresMainQueueSetup() -> Bool { false }

  private let engine = AVAudioEngine()
  private var converter: AVAudioConverter?
  private var isRunning = false
  private let queue = DispatchQueue(label: "NativeMicQueue")

  @objc
  func addListener(_ eventName: String) {
    // Required for NativeEventEmitter; no-op.
  }

  @objc
  func removeListeners(_ count: Double) {
    // Required for NativeEventEmitter; no-op.
  }

  @objc
  func start(_ promise: RCTPromiseResolveBlock?, rejecter reject: RCTPromiseRejectBlock?) {
    if isRunning {
      promise?(nil)
      return
    }
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setPreferredSampleRate(16000)
      try session.setPreferredIOBufferDuration(0.02)
      try session.setActive(true, options: [])

      let input = engine.inputNode
      let inputFormat = input.inputFormat(forBus: 0)
      let outputFormat = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate: 16000,
        channels: 1,
        interleaved: true
      )!
      converter = AVAudioConverter(from: inputFormat, to: outputFormat)

      input.removeTap(onBus: 0)
      input.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, _ in
        self?.handleBuffer(buffer: buffer, inputFormat: inputFormat, outputFormat: outputFormat)
      }

      engine.prepare()
      try engine.start()
      isRunning = true
      promise?(nil)
    } catch {
      reject?("E_MIC_START", error.localizedDescription, error)
    }
  }

  @objc
  func stop(_ promise: RCTPromiseResolveBlock?, rejecter reject: RCTPromiseRejectBlock?) {
    if !isRunning {
      promise?(nil)
      return
    }
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    isRunning = false
    promise?(nil)
  }

  private func handleBuffer(buffer: AVAudioPCMBuffer, inputFormat: AVAudioFormat, outputFormat: AVAudioFormat) {
    queue.async {
      guard let converter = self.converter else { return }
      let frameCapacity = AVAudioFrameCount(outputFormat.sampleRate * Double(buffer.frameLength) / inputFormat.sampleRate)
      guard let outBuffer = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: frameCapacity) else { return }
      var error: NSError?
      let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
        outStatus.pointee = .haveData
        return buffer
      }
      converter.convert(to: outBuffer, error: &error, withInputFrom: inputBlock)
      if error != nil { return }
      guard let channel = outBuffer.int16ChannelData else { return }
      let frames = Int(outBuffer.frameLength)
      let bytes = Data(bytes: channel[0], count: frames * 2)
      if bytes.isEmpty { return }
      let base64 = bytes.base64EncodedString()
      NativeWSModuleHolder.instance?.sendAudioBase64FromNative(base64)
    }
  }
}
