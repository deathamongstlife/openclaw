import Foundation

public enum JarvisDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum JarvisBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum JarvisThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum JarvisNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum JarvisNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct JarvisBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: JarvisBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: JarvisBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct JarvisThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: JarvisThermalState

    public init(state: JarvisThermalState) {
        self.state = state
    }
}

public struct JarvisStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct JarvisNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: JarvisNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [JarvisNetworkInterfaceType]

    public init(
        status: JarvisNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [JarvisNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct JarvisDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: JarvisBatteryStatusPayload
    public var thermal: JarvisThermalStatusPayload
    public var storage: JarvisStorageStatusPayload
    public var network: JarvisNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: JarvisBatteryStatusPayload,
        thermal: JarvisThermalStatusPayload,
        storage: JarvisStorageStatusPayload,
        network: JarvisNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct JarvisDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
