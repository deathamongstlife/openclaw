import Foundation

public enum JarvisCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum JarvisCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum JarvisCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum JarvisCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct JarvisCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: JarvisCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: JarvisCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: JarvisCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: JarvisCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct JarvisCameraClipParams: Codable, Sendable, Equatable {
    public var facing: JarvisCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: JarvisCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: JarvisCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: JarvisCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
