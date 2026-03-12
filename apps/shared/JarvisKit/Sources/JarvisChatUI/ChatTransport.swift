import Foundation

public enum JarvisChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(JarvisChatEventPayload)
    case agent(JarvisAgentEventPayload)
    case seqGap
}

public protocol JarvisChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> JarvisChatHistoryPayload
    func listModels() async throws -> [JarvisChatModelChoice]
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [JarvisChatAttachmentPayload]) async throws -> JarvisChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> JarvisChatSessionsListResponse
    func setSessionModel(sessionKey: String, model: String?) async throws
    func setSessionThinking(sessionKey: String, thinkingLevel: String) async throws

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<JarvisChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension JarvisChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "JarvisChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> JarvisChatSessionsListResponse {
        throw NSError(
            domain: "JarvisChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }

    public func listModels() async throws -> [JarvisChatModelChoice] {
        throw NSError(
            domain: "JarvisChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "models.list not supported by this transport"])
    }

    public func setSessionModel(sessionKey _: String, model _: String?) async throws {
        throw NSError(
            domain: "JarvisChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(model) not supported by this transport"])
    }

    public func setSessionThinking(sessionKey _: String, thinkingLevel _: String) async throws {
        throw NSError(
            domain: "JarvisChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(thinkingLevel) not supported by this transport"])
    }
}
