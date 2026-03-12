// swift-tools-version: 6.2
// Package manifest for the OpenClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "OpenClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "OpenClawIPC", targets: ["OpenClawIPC"]),
        .library(name: "OpenClawDiscovery", targets: ["OpenClawDiscovery"]),
        .executable(name: "OpenClaw", targets: ["OpenClaw"]),
        .executable(name: "openclaw-mac", targets: ["OpenClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/JarvisKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "OpenClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OpenClawDiscovery",
            dependencies: [
                .product(name: "JarvisKit", package: "JarvisKit"),
            ],
            path: "Sources/OpenClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OpenClaw",
            dependencies: [
                "OpenClawIPC",
                "OpenClawDiscovery",
                .product(name: "JarvisKit", package: "JarvisKit"),
                .product(name: "OpenClawChatUI", package: "JarvisKit"),
                .product(name: "OpenClawProtocol", package: "JarvisKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/OpenClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OpenClawMacCLI",
            dependencies: [
                "OpenClawDiscovery",
                .product(name: "JarvisKit", package: "JarvisKit"),
                .product(name: "OpenClawProtocol", package: "JarvisKit"),
            ],
            path: "Sources/OpenClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OpenClawIPCTests",
            dependencies: [
                "OpenClawIPC",
                "OpenClaw",
                "OpenClawDiscovery",
                .product(name: "OpenClawProtocol", package: "JarvisKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
