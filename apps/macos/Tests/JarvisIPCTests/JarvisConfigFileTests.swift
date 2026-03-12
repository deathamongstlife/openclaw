import Foundation
import Testing
@testable import Jarvis

@Suite(.serialized)
struct JarvisConfigFileTests {
    private func makeConfigOverridePath() -> String {
        FileManager().temporaryDirectory
            .appendingPathComponent("jarvis-config-\(UUID().uuidString)")
            .appendingPathComponent("jarvis.json")
            .path
    }

    @Test
    func `config path respects env override`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["JARVIS_CONFIG_PATH": override]) {
            #expect(JarvisConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func `remote gateway port parses and matches host`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["JARVIS_CONFIG_PATH": override]) {
            JarvisConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(JarvisConfigFile.remoteGatewayPort() == 19999)
            #expect(JarvisConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(JarvisConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(JarvisConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func `set remote gateway url preserves scheme`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["JARVIS_CONFIG_PATH": override]) {
            JarvisConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            JarvisConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = JarvisConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @MainActor
    @Test
    func `clear remote gateway url removes only url field`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["JARVIS_CONFIG_PATH": override]) {
            JarvisConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                        "token": "tok",
                    ],
                ],
            ])
            JarvisConfigFile.clearRemoteGatewayUrl()
            let root = JarvisConfigFile.loadDict()
            let remote = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any]) ?? [:]
            #expect((remote["url"] as? String) == nil)
            #expect((remote["token"] as? String) == "tok")
        }
    }

    @Test
    func `state dir override sets config path`() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("jarvis-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "JARVIS_CONFIG_PATH": nil,
            "JARVIS_STATE_DIR": dir,
        ]) {
            #expect(JarvisConfigFile.stateDirURL().path == dir)
            #expect(JarvisConfigFile.url().path == "\(dir)/jarvis.json")
        }
    }

    @MainActor
    @Test
    func `save dict appends config audit log`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("jarvis-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("jarvis.json")
        let auditPath = stateDir.appendingPathComponent("logs/config-audit.jsonl")

        defer { try? FileManager().removeItem(at: stateDir) }

        try await TestIsolation.withEnvValues([
            "JARVIS_STATE_DIR": stateDir.path,
            "JARVIS_CONFIG_PATH": configPath.path,
        ]) {
            JarvisConfigFile.saveDict([
                "gateway": ["mode": "local"],
            ])

            let configData = try Data(contentsOf: configPath)
            let configRoot = try JSONSerialization.jsonObject(with: configData) as? [String: Any]
            #expect((configRoot?["meta"] as? [String: Any]) != nil)

            let rawAudit = try String(contentsOf: auditPath, encoding: .utf8)
            let lines = rawAudit
                .split(whereSeparator: \.isNewline)
                .map(String.init)
            #expect(!lines.isEmpty)
            guard let last = lines.last else {
                Issue.record("Missing config audit line")
                return
            }
            let auditRoot = try JSONSerialization.jsonObject(with: Data(last.utf8)) as? [String: Any]
            #expect(auditRoot?["source"] as? String == "macos-jarvis-config-file")
            #expect(auditRoot?["event"] as? String == "config.write")
            #expect(auditRoot?["result"] as? String == "success")
            #expect(auditRoot?["configPath"] as? String == configPath.path)
        }
    }
}
