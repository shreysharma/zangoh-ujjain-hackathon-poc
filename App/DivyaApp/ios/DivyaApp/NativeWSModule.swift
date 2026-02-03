import Foundation
import React

@objc(NativeWS)
class NativeWSModule: RCTEventEmitter {
  private var session: URLSession?
  private var task: URLSessionWebSocketTask?
  private var nativeAudioPlaybackEnabled = false
  private var needsPcmReinit = false
  private var batch: [[String: Any]] = []
  private var batchTimer: DispatchSourceTimer?
  private let batchIntervalMs: UInt64 = 50

  override init() {
    super.init()
    NativeWSModuleHolder.instance = self
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return [
      "NativeWSOpen",
      "NativeWSClose",
      "NativeWSError",
      "NativeWSBatchParsed",
      "NativeWSParsedImmediate",
      "NativeWSBinary"
    ]
  }

  @objc(connect:headers:)
  func connect(_ url: String, headers: NSDictionary?) {
    disconnect()
    guard let requestUrl = URL(string: url) else { return }
    var request = URLRequest(url: requestUrl)
    if let headers = headers {
      for (key, value) in headers {
        if let k = key as? String, let v = value as? String {
          request.setValue(v, forHTTPHeaderField: k)
        }
      }
    }
    let configuration = URLSessionConfiguration.default
    session = URLSession(configuration: configuration)
    task = session?.webSocketTask(with: request)
    task?.resume()
    sendEvent(withName: "NativeWSOpen", body: nil)
    receiveLoop()
  }

  @objc
  func disconnect() {
    task?.cancel(with: .normalClosure, reason: nil)
    task = nil
    session?.invalidateAndCancel()
    session = nil
  }

  @objc
  func sendText(_ text: String) {
    task?.send(.string(text)) { _ in }
  }

  @objc
  func sendBinaryBase64(_ base64: String) {
    if let data = Data(base64Encoded: base64) {
      task?.send(.data(data)) { _ in }
    }
  }

  @objc
  func setNativeAudioPlaybackEnabled(_ enabled: Bool) {
    nativeAudioPlaybackEnabled = enabled
  }

  func sendAudioBase64FromNative(_ base64: String) {
    let payload: [String: Any] = ["type": "audio", "audio_data": base64]
    if let data = try? JSONSerialization.data(withJSONObject: payload),
       let text = String(data: data, encoding: .utf8) {
      task?.send(.string(text)) { _ in }
    }
  }

  private func receiveLoop() {
    task?.receive { [weak self] result in
      guard let self = self else { return }
      switch result {
      case .failure(let error):
        self.sendEvent(withName: "NativeWSError", body: ["message": error.localizedDescription])
      case .success(let message):
        switch message {
        case .string(let text):
          self.handleMessage(text)
        case .data(let data):
          let base64 = data.base64EncodedString()
          self.sendEvent(withName: "NativeWSBinary", body: base64)
        @unknown default:
          break
        }
      }
      self.receiveLoop()
    }
  }

  private func handleMessage(_ text: String) {
    guard let jsonData = text.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any]
    else {
      enqueue(["type": "unknown", "raw": text])
      return
    }
    let type = (obj["type"] as? String) ?? "unknown"

    if type == "interrupted" && nativeAudioPlaybackEnabled {
      PcmPlayerModuleHolder.instance?.stop(nil)
      needsPcmReinit = true
      NativeWSModuleHolder.botPlaying = false
      NativeWSModuleHolder.dropAudioUntilTurnComplete = true
    }
    if type == "turn_complete" {
      NativeWSModuleHolder.botPlaying = false
      NativeWSModuleHolder.dropAudioUntilTurnComplete = false
    }
    if type == "input_transcription" && NativeWSModuleHolder.botPlaying {
      PcmPlayerModuleHolder.instance?.stop(nil)
      needsPcmReinit = true
      NativeWSModuleHolder.botPlaying = false
      NativeWSModuleHolder.dropAudioUntilTurnComplete = true
    }

    if type == "audio_chunk" && nativeAudioPlaybackEnabled {
      NativeWSModuleHolder.botPlaying = true
      if NativeWSModuleHolder.dropAudioUntilTurnComplete {
        enqueue(parseMessage(obj, includeAudioData: false))
        return
      }
      let audioData = obj["audio_data"] as? String ?? ""
      let mimeType = obj["mime_type"] as? String ?? ""
      let rate = parseRate(mimeType)
      if !audioData.isEmpty {
        if needsPcmReinit || rate != nil {
          PcmPlayerModuleHolder.instance?.initPlayer(rate ?? 24000, promise: nil)
          needsPcmReinit = false
        }
        PcmPlayerModuleHolder.instance?.writeBase64(audioData, promise: nil)
      }
      enqueue(parseMessage(obj, includeAudioData: false))
      return
    }

    let parsed = parseMessage(obj, includeAudioData: true)
    if type == "output_transcription" {
      sendEvent(withName: "NativeWSParsedImmediate", body: parsed)
      return
    }
    enqueue(parsed)
  }

  private func parseRate(_ mimeType: String) -> Int? {
    let pattern = "rate=([0-9]+)"
    guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
    let range = NSRange(location: 0, length: mimeType.count)
    guard let match = regex.firstMatch(in: mimeType, range: range),
          match.numberOfRanges > 1,
          let rateRange = Range(match.range(at: 1), in: mimeType)
    else { return nil }
    return Int(mimeType[rateRange])
  }

  private func parseMessage(_ obj: [String: Any], includeAudioData: Bool) -> [String: Any] {
    var map: [String: Any] = ["type": obj["type"] as? String ?? "unknown"]
    if let text = obj["text"] as? String { map["text"] = text }
    if let tool = obj["tool"] as? String { map["tool"] = tool }
    if let phase = obj["phase"] as? String { map["phase"] = phase }
    if let label = obj["label"] as? String { map["label"] = label }
    if let summary = obj["summary"] as? String { map["summary"] = summary }
    if let duration = obj["duration_ms"] as? Int { map["duration_ms"] = duration }
    if includeAudioData, let audio = obj["audio_data"] as? String { map["audio_data"] = audio }
    if let chunk = obj["chunk_number"] as? Int { map["chunk_number"] = chunk }
    if let size = obj["chunk_size"] as? Int { map["chunk_size"] = size }
    if let mime = obj["mime_type"] as? String { map["mime_type"] = mime }
    if let err = obj["error"] as? String { map["error"] = err }
    if let data = obj["data"] {
      map["data"] = data
    }
    return map
  }

  private func enqueue(_ message: [String: Any]) {
    batch.append(message)
    startBatching()
  }

  private func startBatching() {
    if batchTimer != nil { return }
    let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
    timer.schedule(deadline: .now() + .milliseconds(Int(batchIntervalMs)), repeating: .milliseconds(Int(batchIntervalMs)))
    timer.setEventHandler { [weak self] in
      guard let self = self else { return }
      if self.batch.isEmpty {
        self.batchTimer?.cancel()
        self.batchTimer = nil
        return
      }
      let out = self.batch
      self.batch.removeAll()
      self.sendEvent(withName: "NativeWSBatchParsed", body: out)
    }
    batchTimer = timer
    timer.resume()
  }
}
