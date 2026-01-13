import Foundation

@objcMembers
class NativeWSModuleHolder: NSObject {
  static weak var instance: NativeWSModule?
  static var botPlaying: Bool = false
  static var dropAudioUntilTurnComplete: Bool = false
}
