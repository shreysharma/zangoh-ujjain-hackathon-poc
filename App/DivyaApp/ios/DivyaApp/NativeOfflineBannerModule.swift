import Foundation
import React
import Network
import UIKit

@objc(NativeOfflineBanner)
class NativeOfflineBannerModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "NativeOfflineBanner" }
  static func requiresMainQueueSetup() -> Bool { true }

  private var monitor: NWPathMonitor?
  private let queue = DispatchQueue(label: "NativeOfflineBannerQueue")
  private var bannerView: UILabel?
  private var started = false

  @objc
  func addListener(_ eventName: String) {
    // Required for NativeEventEmitter; no-op.
  }

  @objc
  func removeListeners(_ count: Double) {
    // Required for NativeEventEmitter; no-op.
  }

  @objc
  func start() {
    if started { return }
    started = true
    let monitor = NWPathMonitor()
    self.monitor = monitor
    monitor.pathUpdateHandler = { [weak self] path in
      self?.updateBanner(online: path.status == .satisfied)
    }
    monitor.start(queue: queue)
    updateBanner(online: true)
  }

  @objc
  func stop() {
    monitor?.cancel()
    monitor = nil
    DispatchQueue.main.async {
      self.bannerView?.removeFromSuperview()
      self.bannerView = nil
    }
  }

  private func updateBanner(online: Bool) {
    DispatchQueue.main.async {
      guard let window = UIApplication.shared.windows.first else { return }
      let banner = self.bannerView ?? self.createBanner(in: window)
      banner.isHidden = online
    }
  }

  private func createBanner(in window: UIWindow) -> UILabel {
    let banner = UILabel()
    banner.text = "No internet connection"
    banner.textAlignment = .center
    banner.textColor = .white
    banner.backgroundColor = .systemRed
    banner.font = UIFont.systemFont(ofSize: 14, weight: .medium)
    banner.layer.cornerRadius = 8
    banner.layer.masksToBounds = true

    banner.translatesAutoresizingMaskIntoConstraints = false
    window.addSubview(banner)
    NSLayoutConstraint.activate([
      banner.topAnchor.constraint(equalTo: window.safeAreaLayoutGuide.topAnchor, constant: 12),
      banner.centerXAnchor.constraint(equalTo: window.centerXAnchor),
      banner.widthAnchor.constraint(lessThanOrEqualToConstant: 280),
      banner.heightAnchor.constraint(equalToConstant: 36)
    ])
    banner.isHidden = true
    self.bannerView = banner
    return banner
  }
}
