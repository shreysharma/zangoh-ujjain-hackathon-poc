import Foundation
import React

@objc(TextBuffer)
class TextBufferModule: RCTEventEmitter {
  private var buffer = ""

  override func supportedEvents() -> [String]! {
    return ["TextBufferUpdate"]
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func add(_ text: String) {
    buffer += text
    sendEvent(withName: "TextBufferUpdate", body: buffer)
  }

  @objc
  func reset() {
    buffer = ""
    sendEvent(withName: "TextBufferUpdate", body: buffer)
  }
}
