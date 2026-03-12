import Testing
@testable import Jarvis

@Suite(.serialized)
@MainActor
struct NodePairingApprovalPrompterTests {
    @Test func `node pairing approval prompter exercises`() async {
        await NodePairingApprovalPrompter.exerciseForTesting()
    }
}
