import Foundation

public enum JarvisRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum JarvisReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct JarvisRemindersListParams: Codable, Sendable, Equatable {
    public var status: JarvisReminderStatusFilter?
    public var limit: Int?

    public init(status: JarvisReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct JarvisRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct JarvisReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct JarvisRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [JarvisReminderPayload]

    public init(reminders: [JarvisReminderPayload]) {
        self.reminders = reminders
    }
}

public struct JarvisRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: JarvisReminderPayload

    public init(reminder: JarvisReminderPayload) {
        self.reminder = reminder
    }
}
