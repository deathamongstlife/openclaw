// swift-tools-version: 6.2
// Package manifest for the Jarvis macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Jarvis",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "JarvisIPC", targets: ["JarvisIPC"]),
        .library(name: "JarvisDiscovery", targets: ["JarvisDiscovery"]),
        .executable(name: "Jarvis", targets: ["Jarvis"]),
        .executable(name: "jarvis-mac", targets: ["JarvisMacCLI"]),
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
            name: "JarvisIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "JarvisDiscovery",
            dependencies: [
                .product(name: "JarvisKit", package: "JarvisKit"),
            ],
            path: "Sources/JarvisDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Jarvis",
            dependencies: [
                "JarvisIPC",
                "JarvisDiscovery",
                .product(name: "JarvisKit", package: "JarvisKit"),
                .product(name: "JarvisChatUI", package: "JarvisKit"),
                .product(name: "JarvisProtocol", package: "JarvisKit"),
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
                .copy("Resources/Jarvis.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "JarvisMacCLI",
            dependencies: [
                "JarvisDiscovery",
                .product(name: "JarvisKit", package: "JarvisKit"),
                .product(name: "JarvisProtocol", package: "JarvisKit"),
            ],
            path: "Sources/JarvisMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "JarvisIPCTests",
            dependencies: [
                "JarvisIPC",
                "Jarvis",
                "JarvisDiscovery",
                .product(name: "JarvisProtocol", package: "JarvisKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
