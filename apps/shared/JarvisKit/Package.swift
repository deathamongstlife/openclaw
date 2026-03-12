// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "JarvisKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "JarvisProtocol", targets: ["JarvisProtocol"]),
        .library(name: "JarvisKit", targets: ["JarvisKit"]),
        .library(name: "JarvisChatUI", targets: ["JarvisChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "JarvisProtocol",
            path: "Sources/JarvisProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "JarvisKit",
            dependencies: [
                "JarvisProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/JarvisKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "JarvisChatUI",
            dependencies: [
                "JarvisKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/JarvisChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "JarvisKitTests",
            dependencies: ["JarvisKit", "JarvisChatUI"],
            path: "Tests/JarvisKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
