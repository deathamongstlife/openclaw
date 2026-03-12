import CoreLocation
import Foundation
import JarvisKit
import UIKit

typealias JarvisCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias JarvisCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: JarvisCameraSnapParams) async throws -> JarvisCameraSnapResult
    func clip(params: JarvisCameraClipParams) async throws -> JarvisCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: JarvisLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: JarvisLocationGetParams,
        desiredAccuracy: JarvisLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: JarvisLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> JarvisDeviceStatusPayload
    func info() -> JarvisDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: JarvisPhotosLatestParams) async throws -> JarvisPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: JarvisContactsSearchParams) async throws -> JarvisContactsSearchPayload
    func add(params: JarvisContactsAddParams) async throws -> JarvisContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: JarvisCalendarEventsParams) async throws -> JarvisCalendarEventsPayload
    func add(params: JarvisCalendarAddParams) async throws -> JarvisCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: JarvisRemindersListParams) async throws -> JarvisRemindersListPayload
    func add(params: JarvisRemindersAddParams) async throws -> JarvisRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: JarvisMotionActivityParams) async throws -> JarvisMotionActivityPayload
    func pedometer(params: JarvisPedometerParams) async throws -> JarvisPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: JarvisWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
