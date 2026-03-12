---
name: discord
description: "Discord ops via the message tool (channel=discord)."
metadata: { "jarvis": { "emoji": "🎮", "requires": { "config": ["channels.discord.token"] } } }
allowed-tools: ["message"]
---

# Discord (Via `message`)

Use the `message` tool. No provider-specific `discord` tool exposed to the agent.

## Musts

- Always: `channel: "discord"`.
- Respect gating: `channels.discord.actions.*` (some default off: `roles`, `moderation`, `presence`, `channels`).
- Prefer explicit ids: `guildId`, `channelId`, `messageId`, `userId`.
- Multi-account: optional `accountId`.

## Guidelines

- Avoid Markdown tables in outbound Discord messages.
- Mention users as `<@USER_ID>`.
- Prefer Discord components v2 (`components`) for rich UI; use legacy `embeds` only when you must.
- **Permission Enforcement**: All moderation/management actions check BOTH the bot's permissions AND the requesting user's permissions. If a member doesn't have ban permissions, they cannot direct JARVIS to ban anyone, even if the bot has that permission.

## Targets

- Send-like actions: `to: "channel:<id>"` or `to: "user:<id>"`.
- Message-specific actions: `channelId: "<id>"` (or `to`) + `messageId: "<id>"`.

---

# Core Actions

## Send Message

Basic message sending with optional features.

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "hello",
  "silent": true
}
```

**Parameters:**

- `to`: Target (channel or user)
- `message`: Text content
- `silent`: Suppress notifications (optional)
- `reference`: Reply to message ID (optional)
- `tts`: Text-to-speech (optional, default false)

**Use Cases:**

- Basic communication
- Notifications
- Bot responses
- Automated alerts

**Best Practices:**

- Keep messages under 2000 characters
- Use `silent: true` for bulk operations
- Use `reference` for contextual replies

## Send with Media

Attach files, images, videos to messages.

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "see attachment",
  "media": "file:///tmp/example.png"
}
```

**Parameters:**

- `media`: File path or URL (supports multiple via array)
- `spoiler`: Mark as spoiler (optional)

**Supported Formats:**

- Images: PNG, JPG, GIF, WebP
- Videos: MP4, WebM, MOV
- Audio: MP3, WAV, OGG
- Documents: PDF, TXT, JSON, etc.

**Use Cases:**

- Share screenshots
- Log file attachments
- Diagrams and charts
- Build artifacts

**Best Practices:**

- Max file size: 8MB (non-Nitro), 50MB (Nitro)
- Compress large images
- Use spoiler tags for sensitive content

## React to Messages

Add emoji reactions to messages.

```json
{
  "action": "react",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "emoji": "✅"
}
```

**Parameters:**

- `emoji`: Unicode emoji or custom emoji format (`:name:id`)
- `remove`: Remove reaction instead (optional)

**Use Cases:**

- Acknowledgment systems
- Voting mechanisms
- Status indicators
- Quick responses

**Best Practices:**

- Use standard emojis for broad compatibility
- Custom emoji format: `<:name:id>` or `<a:name:id>` (animated)
- Remove reactions with `remove: true`

## Read Messages

Fetch message history from channels.

```json
{
  "action": "read",
  "channel": "discord",
  "to": "channel:123",
  "limit": 20,
  "before": "messageId",
  "after": "messageId"
}
```

**Parameters:**

- `limit`: Number of messages (1-100, default 50)
- `before`: Get messages before this ID
- `after`: Get messages after this ID
- `around`: Get messages around this ID

**Use Cases:**

- Message history retrieval
- Context gathering
- Audit logging
- Data analysis

**Best Practices:**

- Use pagination with `before`/`after` for large histories
- Cache results to minimize API calls
- Respect rate limits

## Edit Messages

Modify previously sent messages.

```json
{
  "action": "edit",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "message": "fixed typo"
}
```

**Parameters:**

- `message`: New content
- `embeds`: Updated embeds (optional)
- `components`: Updated components (optional)

**Use Cases:**

- Typo corrections
- Status updates
- Dynamic content refresh
- Progressive information disclosure

**Best Practices:**

- Only edit your own messages
- Keep edit history in mind (users can see "edited")
- Update timestamps when content changes

## Delete Messages

Remove messages from channels.

```json
{
  "action": "delete",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

**Parameters:**

- `reason`: Audit log reason (optional)

**Use Cases:**

- Remove spam
- Clean up errors
- Moderate content
- Temporary messages

**Best Practices:**

- Cannot delete messages older than 14 days in bulk
- Use audit log reasons for moderation
- Be cautious with bulk deletion

## Create Polls

Interactive polling system.

```json
{
  "action": "poll",
  "channel": "discord",
  "to": "channel:123",
  "pollQuestion": "Lunch?",
  "pollOption": ["Pizza", "Sushi", "Salad"],
  "pollMulti": false,
  "pollDurationHours": 24
}
```

**Parameters:**

- `pollQuestion`: The poll question
- `pollOption`: Array of options (2-10)
- `pollMulti`: Allow multiple selections
- `pollDurationHours`: Duration (1-168 hours)

**Use Cases:**

- Team decisions
- Feedback collection
- Event planning
- Feature voting

**Best Practices:**

- Keep options concise
- Set reasonable durations
- Use multi-select for preference surveys

## Pin Messages

Pin important messages to channel.

```json
{
  "action": "pin",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

**Parameters:**

- `unpin`: Unpin instead (optional)
- `reason`: Audit log reason (optional)

**Use Cases:**

- Important announcements
- Channel guidelines
- Reference materials
- Event information

**Best Practices:**

- Maximum 50 pins per channel
- Unpin old content regularly
- Use for truly important content only

## Create Threads

Start threaded conversations.

```json
{
  "action": "thread-create",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "threadName": "bug triage",
  "autoArchiveDuration": 1440
}
```

**Parameters:**

- `threadName`: Thread name (1-100 chars)
- `autoArchiveDuration`: Archive after inactivity (60, 1440, 4320, 10080 minutes)
- `slowmode`: Slowmode in seconds (optional)
- `private`: Create private thread (optional, requires guild boost level 2)

**Use Cases:**

- Topic-specific discussions
- Bug triage
- Feature planning
- Support tickets

**Best Practices:**

- Use descriptive thread names
- Set appropriate auto-archive duration
- Archive manually when resolved

## Search Messages

Search guild messages by content.

```json
{
  "action": "search",
  "channel": "discord",
  "guildId": "999",
  "query": "release notes",
  "channelIds": ["123", "456"],
  "limit": 10,
  "authorId": "789",
  "mentions": "userId",
  "has": "link",
  "before": "2024-01-01",
  "after": "2023-01-01"
}
```

**Parameters:**

- `query`: Search text
- `channelIds`: Filter by channels (optional)
- `authorId`: Filter by author (optional)
- `mentions`: Filter by mentioned user (optional)
- `has`: Filter by content type: `link`, `embed`, `file`, `video`, `image`, `sound`
- `before`/`after`: Date filters (YYYY-MM-DD)
- `limit`: Results limit (default 25)

**Use Cases:**

- Finding old messages
- Audit trails
- Information retrieval
- Content analysis

**Best Practices:**

- Use specific queries to reduce results
- Combine filters for precision
- Respect search rate limits

## Set Presence

Update bot status and activity.

```json
{
  "action": "set-presence",
  "channel": "discord",
  "activityType": "playing",
  "activityName": "with fire",
  "status": "online",
  "afk": false
}
```

**Parameters:**

- `status`: `online`, `idle`, `dnd`, `invisible`
- `activityType`: `playing`, `streaming`, `listening`, `watching`, `competing`
- `activityName`: Activity text
- `url`: Stream URL (for `streaming` type)
- `afk`: AFK status (optional)

**Use Cases:**

- Status indicators
- Service health display
- Promotional messaging
- User engagement

**Best Practices:**

- Update presence sparingly (rate limited)
- Use meaningful activity names
- Avoid rapid status changes

---

# Advanced Message Features

## Message Scheduling

Schedule messages for future delivery.

```json
{
  "action": "schedule-message",
  "channel": "discord",
  "to": "channel:123",
  "message": "Daily standup reminder",
  "scheduleTime": "2024-03-15T09:00:00Z",
  "timezone": "America/New_York",
  "repeat": "daily"
}
```

**Parameters:**

- `scheduleTime`: ISO 8601 timestamp
- `timezone`: IANA timezone name
- `repeat`: `none`, `daily`, `weekly`, `monthly`
- `repeatEnd`: End date for recurring (optional)

**Use Cases:**

- Scheduled announcements
- Recurring reminders
- Time-zone appropriate messages
- Automated reports

**Best Practices:**

- Use UTC internally, display local times
- Cancel scheduled messages when plans change
- Verify timezone conversions

## Message Templates

Reusable message templates with variable substitution.

```json
{
  "action": "send-template",
  "channel": "discord",
  "to": "channel:123",
  "template": "welcome",
  "variables": {
    "username": "Alice",
    "serverName": "DevOps Hub",
    "memberCount": "1,234"
  }
}
```

**Template Definition:**

```json
{
  "action": "define-template",
  "channel": "discord",
  "templateName": "welcome",
  "content": "Welcome {{username}} to {{serverName}}! You're member #{{memberCount}}.",
  "embeds": [
    {
      "title": "Welcome Guide",
      "description": "Check out <#rules-channel> to get started!"
    }
  ]
}
```

**Parameters:**

- `template`: Template name or inline template string
- `variables`: Key-value pairs for substitution
- `templateName`: For template definition

**Use Cases:**

- Welcome messages
- Standardized responses
- Multi-language support
- Consistent formatting

**Best Practices:**

- Use `{{variable}}` syntax for substitution
- Define templates separately from usage
- Version templates for changes

## Bulk Message Operations

Perform operations on multiple messages.

```json
{
  "action": "bulk-delete",
  "channel": "discord",
  "channelId": "123",
  "messageIds": ["456", "457", "458"],
  "reason": "spam cleanup"
}
```

```json
{
  "action": "bulk-react",
  "channel": "discord",
  "channelId": "123",
  "messageIds": ["456", "457"],
  "emoji": "✅"
}
```

**Parameters:**

- `messageIds`: Array of message IDs (2-100)
- `reason`: Audit log reason
- `filter`: Filter criteria (optional)

**Use Cases:**

- Spam removal
- Mass acknowledgment
- Channel cleanup
- Batch processing

**Best Practices:**

- Maximum 100 messages per bulk delete
- Messages must be less than 14 days old
- Use for moderation, not regular cleanup

## Message Forwarding

Forward messages between channels.

```json
{
  "action": "forward-message",
  "channel": "discord",
  "sourceChannelId": "123",
  "sourceMessageId": "456",
  "targetChannelId": "789",
  "includeEmbeds": true,
  "includeAttachments": true,
  "attribution": true
}
```

**Parameters:**

- `sourceChannelId`: Source channel
- `sourceMessageId`: Message to forward
- `targetChannelId`: Destination channel
- `includeEmbeds`: Copy embeds (default true)
- `includeAttachments`: Copy attachments (default true)
- `attribution`: Show original author (default true)

**Use Cases:**

- Cross-channel sharing
- Content aggregation
- Highlight interesting messages
- Moderation reports

**Best Practices:**

- Respect attachment size limits
- Preserve attribution when possible
- Check target channel permissions

## Cross-Posting to Announcement Channels

Publish messages to follower channels.

```json
{
  "action": "crosspost",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

**Parameters:**

- `channelId`: Announcement channel ID
- `messageId`: Message to crosspost

**Use Cases:**

- Server-wide announcements
- Multi-guild notifications
- Official updates
- Event broadcasts

**Best Practices:**

- Only works in announcement channels
- Messages are auto-followed to subscribed channels
- Cannot be undone easily

## Slash Command Handling

Respond to slash command interactions.

```json
{
  "action": "register-command",
  "channel": "discord",
  "name": "stats",
  "description": "Show server statistics",
  "options": [
    {
      "type": "string",
      "name": "metric",
      "description": "Metric to display",
      "required": true,
      "choices": [
        { "name": "Members", "value": "members" },
        { "name": "Messages", "value": "messages" },
        { "name": "Activity", "value": "activity" }
      ]
    }
  ],
  "guildId": "999"
}
```

```json
{
  "action": "respond-interaction",
  "channel": "discord",
  "interactionId": "123",
  "interactionToken": "token",
  "responseType": "channel_message",
  "message": "Server has 1,234 members",
  "ephemeral": true
}
```

**Parameters:**

- `name`: Command name (lowercase, no spaces)
- `description`: Command description
- `options`: Command parameters
- `responseType`: `channel_message`, `deferred`, `update_message`
- `ephemeral`: Only visible to command user

**Use Cases:**

- Custom bot commands
- Interactive features
- User tools
- Guild-specific functionality

**Best Practices:**

- Register commands on bot startup
- Respond within 3 seconds (use deferred for slow ops)
- Use ephemeral for private responses

---

# Rich Embeds & Components

## Interactive Button Rows

Add clickable buttons to messages.

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Choose an action:",
  "components": [
    {
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 1,
          "label": "Approve",
          "custom_id": "approve_btn",
          "emoji": { "name": "✅" }
        },
        {
          "type": 2,
          "style": 4,
          "label": "Reject",
          "custom_id": "reject_btn",
          "emoji": { "name": "❌" }
        },
        {
          "type": 2,
          "style": 5,
          "label": "Documentation",
          "url": "https://example.com/docs"
        }
      ]
    }
  ]
}
```

**Button Styles:**

- `1`: Primary (blurple)
- `2`: Secondary (grey)
- `3`: Success (green)
- `4`: Danger (red)
- `5`: Link (grey, requires `url`)

**Parameters:**

- `label`: Button text (max 80 chars)
- `custom_id`: Unique identifier for callback
- `style`: Button color style
- `emoji`: Emoji (optional)
- `disabled`: Disable button (optional)
- `url`: Link URL (style 5 only)

**Use Cases:**

- Approval workflows
- Interactive menus
- Quick actions
- External links

**Best Practices:**

- Max 5 buttons per row, 5 rows per message
- Use descriptive labels
- Implement interaction handlers for `custom_id`
- Link buttons don't trigger interactions

## Select Menus

Dropdown selection components.

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Select your role:",
  "components": [
    {
      "type": 1,
      "components": [
        {
          "type": 3,
          "custom_id": "role_select",
          "placeholder": "Choose a role",
          "min_values": 1,
          "max_values": 3,
          "options": [
            {
              "label": "Developer",
              "value": "dev",
              "description": "Software development role",
              "emoji": { "name": "💻" }
            },
            {
              "label": "Designer",
              "value": "design",
              "description": "UI/UX design role",
              "emoji": { "name": "🎨" }
            },
            {
              "label": "Manager",
              "value": "manager",
              "description": "Project management role",
              "emoji": { "name": "📊" }
            }
          ]
        }
      ]
    }
  ]
}
```

**Select Menu Types:**

- `3`: String select (custom options)
- `5`: User select
- `6`: Role select
- `7`: Mentionable select (users + roles)
- `8`: Channel select

**Parameters:**

- `custom_id`: Unique identifier
- `placeholder`: Placeholder text
- `min_values`: Minimum selections (default 1)
- `max_values`: Maximum selections (default 1)
- `options`: Array of options (string select only)

**Use Cases:**

- Role assignment
- Multi-choice forms
- User selection
- Channel routing

**Best Practices:**

- Max 25 options per select
- Use type-specific selects for built-in types
- Clear placeholder text

## Modal Forms

Popup forms for user input.

```json
{
  "action": "show-modal",
  "channel": "discord",
  "interactionId": "123",
  "interactionToken": "token",
  "customId": "bug_report_modal",
  "title": "Report a Bug",
  "components": [
    {
      "type": 1,
      "components": [
        {
          "type": 4,
          "custom_id": "bug_title",
          "label": "Bug Title",
          "style": 1,
          "placeholder": "Brief description",
          "required": true,
          "max_length": 100
        }
      ]
    },
    {
      "type": 1,
      "components": [
        {
          "type": 4,
          "custom_id": "bug_description",
          "label": "Description",
          "style": 2,
          "placeholder": "Detailed bug description",
          "required": true,
          "max_length": 4000
        }
      ]
    }
  ]
}
```

**Text Input Styles:**

- `1`: Short (single line)
- `2`: Paragraph (multi-line)

**Parameters:**

- `title`: Modal title (max 45 chars)
- `custom_id`: Unique identifier
- `label`: Input label
- `style`: Input style (1 or 2)
- `required`: Required field (optional)
- `value`: Pre-filled value (optional)
- `min_length`/`max_length`: Character limits

**Use Cases:**

- Bug reports
- Feedback forms
- User registration
- Data collection

**Best Practices:**

- Max 5 text inputs per modal
- Must be triggered from button/command interaction
- Handle modal submission within 15 minutes

## Advanced Embed Features

Rich formatted message embeds.

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "embeds": [
    {
      "title": "System Status",
      "description": "Current system health overview",
      "url": "https://status.example.com",
      "color": 3066993,
      "timestamp": "2024-03-12T15:30:00Z",
      "footer": {
        "text": "Updated every 5 minutes",
        "icon_url": "https://example.com/icon.png"
      },
      "thumbnail": {
        "url": "https://example.com/thumb.png"
      },
      "image": {
        "url": "https://example.com/graph.png"
      },
      "author": {
        "name": "Monitoring Bot",
        "url": "https://example.com",
        "icon_url": "https://example.com/avatar.png"
      },
      "fields": [
        {
          "name": "API Status",
          "value": "🟢 Operational",
          "inline": true
        },
        {
          "name": "Database",
          "value": "🟢 Operational",
          "inline": true
        },
        {
          "name": "Uptime",
          "value": "99.98%",
          "inline": true
        }
      ]
    }
  ]
}
```

**Parameters:**

- `title`: Embed title (max 256 chars)
- `description`: Main content (max 4096 chars)
- `url`: Title hyperlink
- `color`: Decimal color code
- `timestamp`: ISO 8601 timestamp
- `footer`: Footer with text and icon
- `thumbnail`: Small image (top right)
- `image`: Large image (bottom)
- `author`: Author section (top)
- `fields`: Array of fields (max 25)

**Field Parameters:**

- `name`: Field title (max 256 chars)
- `value`: Field content (max 1024 chars)
- `inline`: Display inline (optional)

**Use Cases:**

- Status updates
- Rich notifications
- Data displays
- Formatted reports

**Best Practices:**

- Max 10 embeds per message
- Total embed character limit: 6000
- Use color coding for status
- Inline fields appear in rows of 3

## Embed Pagination

Navigate through multiple embed pages.

```json
{
  "action": "send-paginated",
  "channel": "discord",
  "to": "channel:123",
  "pages": [
    {
      "title": "Page 1: Introduction",
      "description": "Welcome to the guide..."
    },
    {
      "title": "Page 2: Setup",
      "description": "Installation steps..."
    },
    {
      "title": "Page 3: Usage",
      "description": "How to use the feature..."
    }
  ],
  "timeout": 300
}
```

**Parameters:**

- `pages`: Array of embed objects
- `timeout`: Interaction timeout in seconds (default 300)
- `showPageNumbers`: Display "Page X of Y" (default true)
- `userId`: Restrict to specific user (optional)

**Use Cases:**

- Documentation
- Long lists
- Guides and tutorials
- Search results

**Best Practices:**

- Keep pages focused and concise
- Add page indicators in footer
- Implement Next/Previous/First/Last buttons
- Set reasonable timeouts

## Dynamic Embed Updates

Update embeds in real-time.

```json
{
  "action": "update-embed",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "embeds": [
    {
      "title": "Live Counter",
      "description": "Current value: 42",
      "color": 3066993,
      "timestamp": "2024-03-12T15:30:00Z"
    }
  ]
}
```

**Use Cases:**

- Live dashboards
- Progress indicators
- Real-time stats
- Dynamic content

**Best Practices:**

- Rate limit updates (avoid spam)
- Include timestamps
- Use color changes for state
- Cache previous state

---

# Server/Guild Management

## List Guilds and Channels

Retrieve guild and channel information.

```json
{
  "action": "list-guilds",
  "channel": "discord"
}
```

```json
{
  "action": "list-channels",
  "channel": "discord",
  "guildId": "999",
  "type": "text"
}
```

**Parameters:**

- `type`: Filter by type: `text`, `voice`, `category`, `news`, `stage`
- `includePermissions`: Include permission info (optional)

**Use Cases:**

- Guild discovery
- Channel listing
- Permission audits
- Automation setup

**Best Practices:**

- Cache guild/channel lists
- Filter by type to reduce results
- Check permissions before operations

## Create Channels

Create new text, voice, or category channels.

```json
{
  "action": "create-channel",
  "channel": "discord",
  "guildId": "999",
  "name": "dev-chat",
  "type": "text",
  "topic": "Development discussion",
  "parentId": "category-id",
  "position": 5,
  "nsfw": false,
  "slowmode": 5
}
```

**Channel Types:**

- `text` (0): Text channel
- `voice` (2): Voice channel
- `category` (4): Category container
- `news` (5): Announcement channel
- `stage` (13): Stage voice channel

**Parameters:**

- `name`: Channel name (2-100 chars)
- `type`: Channel type
- `topic`: Channel topic (text channels only, max 1024 chars)
- `parentId`: Category ID (optional)
- `position`: Sort position (optional)
- `nsfw`: NSFW flag (optional)
- `slowmode`: Seconds between messages (0-21600)
- `userLimit`: Voice channel user limit (0-99, 0 = unlimited)

**Use Cases:**

- Dynamic channel creation
- Event-specific channels
- Project workspaces
- Temporary channels

**Best Practices:**

- Use categories for organization
- Set appropriate permissions
- Clean up temporary channels

## Delete/Modify Channels

Update or remove channels.

```json
{
  "action": "modify-channel",
  "channel": "discord",
  "channelId": "123",
  "name": "new-name",
  "topic": "Updated topic",
  "position": 10,
  "reason": "Channel reorganization"
}
```

```json
{
  "action": "delete-channel",
  "channel": "discord",
  "channelId": "123",
  "reason": "No longer needed"
}
```

**Parameters:**

- All create-channel parameters can be updated
- `reason`: Audit log reason (optional)

**Use Cases:**

- Channel reorganization
- Topic updates
- Cleanup operations
- Permission changes

**Best Practices:**

- Archive before delete when possible
- Document reason in audit log
- Verify no active users in voice channels

## Channel Permissions Management

Manage channel-specific permissions.

```json
{
  "action": "set-channel-permissions",
  "channel": "discord",
  "channelId": "123",
  "targetId": "role-or-user-id",
  "targetType": "role",
  "allow": ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
  "deny": ["ATTACH_FILES", "EMBED_LINKS"],
  "reason": "Restricted permissions for new members"
}
```

**Common Permissions:**

- `VIEW_CHANNEL`: See channel
- `SEND_MESSAGES`: Send messages
- `READ_MESSAGE_HISTORY`: Read history
- `ATTACH_FILES`: Upload files
- `EMBED_LINKS`: Post embeds
- `MENTION_EVERYONE`: Mention @everyone
- `MANAGE_MESSAGES`: Delete others' messages
- `MANAGE_CHANNELS`: Edit channel
- `CONNECT`: Join voice
- `SPEAK`: Speak in voice

**Parameters:**

- `targetId`: Role or user ID
- `targetType`: `role` or `member`
- `allow`: Array of allowed permissions
- `deny`: Array of denied permissions
- `reason`: Audit log reason

**Use Cases:**

- Role-based access control
- Private channels
- Read-only channels
- Moderator permissions

**Best Practices:**

- Use role permissions over user permissions
- Test permission changes
- Document permission rationale

## Category Management

Organize channels with categories.

```json
{
  "action": "create-category",
  "channel": "discord",
  "guildId": "999",
  "name": "Development",
  "position": 0
}
```

```json
{
  "action": "move-to-category",
  "channel": "discord",
  "channelId": "123",
  "categoryId": "456",
  "syncPermissions": true
}
```

**Parameters:**

- `name`: Category name
- `position`: Sort order
- `syncPermissions`: Apply category permissions to channel

**Use Cases:**

- Channel organization
- Permission inheritance
- Visual grouping
- Access control

**Best Practices:**

- Use categories for permission management
- Sync permissions for consistency
- Meaningful category names

## Get Guild Info

Retrieve detailed guild information.

```json
{
  "action": "get-guild-info",
  "channel": "discord",
  "guildId": "999",
  "includeMembers": true,
  "includeChannels": true,
  "includeRoles": true
}
```

**Returns:**

- Guild name, ID, icon
- Owner information
- Member count
- Role list
- Channel list
- Boost level and count
- Features and settings

**Use Cases:**

- Server analytics
- Audit reports
- Member statistics
- Configuration verification

**Best Practices:**

- Cache guild info
- Update periodically
- Minimize API calls

---

# Role Management

## Assign/Remove Roles

Manage user roles.

```json
{
  "action": "assign-role",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "roleId": "456",
  "reason": "Promotion to moderator"
}
```

```json
{
  "action": "remove-role",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "roleId": "456",
  "reason": "End of trial period"
}
```

**Parameters:**

- `userId`: Target user
- `roleId`: Role to assign/remove
- `reason`: Audit log reason

**Use Cases:**

- User promotions
- Access management
- Reward systems
- Onboarding

**Best Practices:**

- Verify permissions before assignment
- Document role changes
- Check role hierarchy

## Create Custom Roles

Define new roles with permissions and appearance.

```json
{
  "action": "create-role",
  "channel": "discord",
  "guildId": "999",
  "name": "Senior Developer",
  "color": 3066993,
  "hoist": true,
  "mentionable": true,
  "permissions": ["MANAGE_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS"],
  "reason": "New team tier"
}
```

**Parameters:**

- `name`: Role name (max 100 chars)
- `color`: RGB color (decimal)
- `hoist`: Display separately in member list
- `mentionable`: Allow @mention
- `permissions`: Array of permissions
- `icon`: Role icon (emoji or URL, requires boost)

**Use Cases:**

- Team structure
- Permission groups
- Visual hierarchy
- Special badges

**Best Practices:**

- Use color coding system
- Limit high-privilege roles
- Descriptive role names

## Role Hierarchy Management

Manage role positions and inheritance.

```json
{
  "action": "reorder-roles",
  "channel": "discord",
  "guildId": "999",
  "roles": [
    { "id": "role1", "position": 10 },
    { "id": "role2", "position": 9 },
    { "id": "role3", "position": 8 }
  ]
}
```

**Parameters:**

- `roles`: Array of role IDs with positions
- Higher position = more authority

**Use Cases:**

- Permission hierarchy
- Moderation structure
- Role organization
- Access control

**Best Practices:**

- Bot's role must be higher to manage others
- Owner always has highest implicit position
- Test hierarchy changes

## Temporary Roles

Assign roles with automatic expiration.

```json
{
  "action": "assign-temporary-role",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "roleId": "456",
  "duration": 86400,
  "reason": "Trial moderator period"
}
```

**Parameters:**

- `duration`: Seconds until auto-removal
- `notify`: Send DM on expiration (optional)
- `reason`: Assignment reason

**Use Cases:**

- Trial periods
- Temporary access
- Time-limited rewards
- Event participation

**Best Practices:**

- Track expiration times
- Notify users before expiration
- Use for non-permanent assignments

## Bulk Role Operations

Manage roles for multiple users.

```json
{
  "action": "bulk-assign-roles",
  "channel": "discord",
  "guildId": "999",
  "userIds": ["123", "124", "125"],
  "roleIds": ["456", "457"],
  "reason": "Event participants"
}
```

```json
{
  "action": "bulk-remove-roles",
  "channel": "discord",
  "guildId": "999",
  "userIds": ["123", "124"],
  "roleIds": ["456"],
  "reason": "Event ended"
}
```

**Use Cases:**

- Event management
- Mass promotions
- Access revocation
- Onboarding groups

**Best Practices:**

- Rate limit consideration
- Batch operations appropriately
- Verify user lists before bulk ops

---

# Moderation Features

## Kick Users

Remove users from guild.

```json
{
  "action": "kick",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "reason": "Violation of rule 3"
}
```

**Parameters:**

- `userId`: User to kick
- `reason`: Reason shown in audit log and DM
- `notify`: Send DM to user (default true)

**Use Cases:**

- Rule enforcement
- Spam removal
- Temporary removal
- Warning escalation

**Best Practices:**

- Document reason clearly
- Send warning before kick when appropriate
- User can rejoin with new invite

## Ban Users

Permanently ban users from guild.

```json
{
  "action": "ban",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "deleteMessageDays": 7,
  "reason": "Repeated harassment"
}
```

```json
{
  "action": "unban",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "reason": "Ban appeal approved"
}
```

**Parameters:**

- `userId`: User to ban/unban
- `deleteMessageDays`: Delete messages from past N days (0-7)
- `reason`: Ban reason

**Use Cases:**

- Severe rule violations
- Malicious users
- Ban appeals
- Spam accounts

**Best Practices:**

- Clear ban reasons for audit
- Consider timeout for temporary issues
- Review bans periodically

## Timeout Users

Temporarily mute users.

```json
{
  "action": "timeout",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "duration": 3600,
  "reason": "Spam in #general"
}
```

```json
{
  "action": "remove-timeout",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "reason": "Timeout period reduced"
}
```

**Parameters:**

- `duration`: Timeout seconds (max 2419200 = 28 days)
- `reason`: Timeout reason

**Use Cases:**

- Cooling off periods
- Minor infractions
- Spam prevention
- Temporary muting

**Best Practices:**

- Use instead of ban for minor issues
- Escalate to kick/ban if needed
- Clear communication of duration

## Bulk Message Deletion

Delete multiple messages at once.

```json
{
  "action": "bulk-delete",
  "channel": "discord",
  "channelId": "123",
  "messageIds": ["456", "457", "458"],
  "reason": "Spam cleanup"
}
```

```json
{
  "action": "purge-messages",
  "channel": "discord",
  "channelId": "123",
  "limit": 100,
  "filter": {
    "userId": "spam-bot-id",
    "contains": "spam keyword",
    "hasFiles": false,
    "hasPins": false
  }
}
```

**Parameters:**

- `messageIds`: Specific messages (2-100)
- `limit`: Number of recent messages to check
- `filter`: Deletion criteria
- Messages must be less than 14 days old

**Use Cases:**

- Spam removal
- Conversation cleanup
- Bot message pruning
- Channel resets

**Best Practices:**

- Cannot delete pinned messages with bulk delete
- Use filters to avoid deleting wanted content
- Log deleted content for appeals

## Auto-Moderation Rules

Configure automatic moderation.

```json
{
  "action": "create-automod-rule",
  "channel": "discord",
  "guildId": "999",
  "name": "Block spam",
  "eventType": "message_send",
  "triggerType": "keyword",
  "triggerMetadata": {
    "keywordFilter": ["spam", "scam", "free nitro"],
    "regexPatterns": ["(http|https)://discord\\.gg/\\w+"]
  },
  "actions": [
    {
      "type": "block_message"
    },
    {
      "type": "timeout",
      "metadata": { "duration": 600 }
    },
    {
      "type": "send_alert_message",
      "metadata": {
        "channelId": "mod-logs-channel-id"
      }
    }
  ],
  "exemptRoles": ["moderator-role-id"],
  "exemptChannels": ["bot-commands-channel-id"]
}
```

**Trigger Types:**

- `keyword`: Keyword/phrase matching
- `spam`: Repeated content detection
- `keyword_preset`: Built-in filter lists
- `mention_spam`: Excessive mentions

**Action Types:**

- `block_message`: Delete message
- `timeout`: Timeout user
- `send_alert_message`: Log to channel

**Use Cases:**

- Spam prevention
- Link filtering
- Profanity blocking
- Mention abuse prevention

**Best Practices:**

- Start with lenient rules
- Exempt mod channels
- Monitor false positives
- Layer multiple actions

## Warning System

Track and manage user warnings.

```json
{
  "action": "warn-user",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "reason": "Inappropriate language",
  "severity": "medium",
  "autoEscalate": true
}
```

```json
{
  "action": "get-warnings",
  "channel": "discord",
  "guildId": "999",
  "userId": "123"
}
```

**Parameters:**

- `reason`: Warning reason
- `severity`: `low`, `medium`, `high`
- `autoEscalate`: Automatic action on threshold
- `expiresAfter`: Seconds until warning expires

**Escalation Rules:**

```json
{
  "action": "set-escalation-rules",
  "channel": "discord",
  "guildId": "999",
  "rules": [
    { "warnings": 3, "action": "timeout", "duration": 3600 },
    { "warnings": 5, "action": "kick" },
    { "warnings": 7, "action": "ban" }
  ]
}
```

**Use Cases:**

- Progressive discipline
- Warning tracking
- Automated moderation
- Appeal records

**Best Practices:**

- Clear warning criteria
- Fair escalation rules
- Warning expiration
- Appeal process

## Moderation Logs

Track all moderation actions.

```json
{
  "action": "get-audit-log",
  "channel": "discord",
  "guildId": "999",
  "actionType": "member_ban_add",
  "userId": "moderator-id",
  "limit": 50
}
```

```json
{
  "action": "log-mod-action",
  "channel": "discord",
  "guildId": "999",
  "logChannelId": "mod-logs-123",
  "action": "ban",
  "targetUserId": "123",
  "moderatorId": "456",
  "reason": "Spam",
  "evidence": ["screenshot-url"]
}
```

**Action Types:**

- `member_kick`
- `member_ban_add`
- `member_ban_remove`
- `member_update` (roles, timeout)
- `message_delete`
- `message_bulk_delete`

**Use Cases:**

- Moderation accountability
- Action review
- Appeals evidence
- Team coordination

**Best Practices:**

- Centralized log channel
- Include evidence links
- Regular log review
- Preserve for appeals

---

# Voice Channel Features

## Move Users Between Voice Channels

Relocate users across voice channels.

```json
{
  "action": "move-user-voice",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "targetChannelId": "voice-456",
  "reason": "Moving to appropriate channel"
}
```

**Parameters:**

- `userId`: User to move
- `targetChannelId`: Destination voice channel
- `reason`: Optional audit log reason

**Use Cases:**

- Event management
- Team organization
- Moderation
- User assistance

**Best Practices:**

- Verify user is in voice
- Check target channel capacity
- Announce moves in text

## Voice Channel Creation/Management

Create and configure voice channels.

```json
{
  "action": "create-voice-channel",
  "channel": "discord",
  "guildId": "999",
  "name": "Gaming Room",
  "userLimit": 10,
  "bitrate": 64000,
  "videoQualityMode": "auto",
  "parentId": "category-id"
}
```

**Parameters:**

- `userLimit`: Max users (0-99, 0 = unlimited)
- `bitrate`: Audio quality (8000-384000, varies by boost level)
- `videoQualityMode`: `auto` or `full` (720p)
- `rtcRegion`: Voice region (auto by default)

**Use Cases:**

- Dynamic voice rooms
- Event spaces
- Team channels
- Gaming lobbies

**Best Practices:**

- Set appropriate bitrate for boost level
- Use user limits for small groups
- Clean up empty temporary channels

## Stage Channel Management

Manage stage channels (audience + speakers).

```json
{
  "action": "create-stage",
  "channel": "discord",
  "guildId": "999",
  "channelId": "stage-channel-id",
  "topic": "Monthly Q&A Session",
  "privacyLevel": "guild_only",
  "notifyEveryone": true
}
```

```json
{
  "action": "update-stage",
  "channel": "discord",
  "channelId": "stage-channel-id",
  "topic": "Updated topic"
}
```

```json
{
  "action": "end-stage",
  "channel": "discord",
  "channelId": "stage-channel-id"
}
```

**Parameters:**

- `topic`: Stage topic/title
- `privacyLevel`: `public` or `guild_only`
- `notifyEveryone`: Send @everyone notification

**Speaker Management:**

```json
{
  "action": "invite-stage-speaker",
  "channel": "discord",
  "channelId": "stage-channel-id",
  "userId": "123"
}
```

**Use Cases:**

- Town halls
- Q&A sessions
- Presentations
- Community events

**Best Practices:**

- Clear stage topics
- Manage speaker permissions
- Moderate audience questions
- End stages when complete

## Voice Region Settings

Configure voice server location.

```json
{
  "action": "set-voice-region",
  "channel": "discord",
  "channelId": "voice-123",
  "region": "us-west"
}
```

**Available Regions:**

- `us-west`, `us-east`, `us-central`, `us-south`
- `europe`, `russia`, `singapore`, `hong kong`, `sydney`, `brazil`, `japan`, `south africa`
- `auto` (automatic selection)

**Use Cases:**

- Latency optimization
- Geographic proximity
- Connection quality
- User experience

**Best Practices:**

- Use `auto` unless specific needs
- Test different regions
- Consider user locations

---

# Webhook Management

## Create/Manage Webhooks

Create and configure webhooks.

```json
{
  "action": "create-webhook",
  "channel": "discord",
  "channelId": "123",
  "name": "GitHub Bot",
  "avatar": "https://github.com/avatar.png",
  "reason": "GitHub integration"
}
```

```json
{
  "action": "get-webhooks",
  "channel": "discord",
  "channelId": "123"
}
```

```json
{
  "action": "delete-webhook",
  "channel": "discord",
  "webhookId": "webhook-id",
  "webhookToken": "webhook-token"
}
```

**Parameters:**

- `name`: Webhook name (1-80 chars)
- `avatar`: Avatar URL or data URI
- `reason`: Audit log reason

**Use Cases:**

- External integrations
- Bot automation
- Custom message formatting
- Multi-service notifications

**Best Practices:**

- Secure webhook URLs
- Descriptive names and avatars
- Delete unused webhooks
- Rate limit consideration

## Send via Webhooks

Post messages through webhooks.

```json
{
  "action": "webhook-send",
  "channel": "discord",
  "webhookId": "webhook-id",
  "webhookToken": "webhook-token",
  "content": "Deployment complete!",
  "username": "Deploy Bot",
  "avatarUrl": "https://example.com/avatar.png",
  "embeds": [
    {
      "title": "Production Deploy",
      "description": "Version 2.0.1 deployed successfully",
      "color": 3066993,
      "fields": [
        { "name": "Commit", "value": "abc123" },
        { "name": "Duration", "value": "2m 30s" }
      ]
    }
  ],
  "threadId": "thread-id"
}
```

**Parameters:**

- `content`: Message text
- `username`: Override webhook name
- `avatarUrl`: Override webhook avatar
- `embeds`: Array of embeds
- `files`: File attachments
- `threadId`: Send to thread (optional)
- `wait`: Return message object (default false)

**Use Cases:**

- CI/CD notifications
- External service alerts
- Custom bot messages
- Integration relays

**Best Practices:**

- Cache webhook URLs securely
- Use embeds for rich formatting
- Set appropriate username/avatar
- Handle rate limits

## Webhook Message Editing

Edit messages sent via webhooks.

```json
{
  "action": "webhook-edit",
  "channel": "discord",
  "webhookId": "webhook-id",
  "webhookToken": "webhook-token",
  "messageId": "message-id",
  "content": "Updated deployment status",
  "embeds": [
    {
      "title": "Deploy Status: Complete",
      "color": 3066993
    }
  ]
}
```

```json
{
  "action": "webhook-delete",
  "channel": "discord",
  "webhookId": "webhook-id",
  "webhookToken": "webhook-token",
  "messageId": "message-id"
}
```

**Use Cases:**

- Live status updates
- Progressive information
- Error corrections
- Dynamic dashboards

**Best Practices:**

- Store message IDs for editing
- Update timestamps on edits
- Delete obsolete messages

---

# Advanced Features

## Welcome/Goodbye Messages Automation

Automated member join/leave messages.

```json
{
  "action": "set-welcome-config",
  "channel": "discord",
  "guildId": "999",
  "enabled": true,
  "channelId": "welcome-123",
  "message": "Welcome {{user}} to {{server}}! We now have {{memberCount}} members.",
  "dm": true,
  "dmMessage": "Welcome to {{server}}! Please read <#rules-channel>.",
  "roleIds": ["new-member-role"],
  "deleteAfter": 300
}
```

```json
{
  "action": "set-goodbye-config",
  "channel": "discord",
  "guildId": "999",
  "enabled": true,
  "channelId": "logs-456",
  "message": "{{user}} has left the server. Member count: {{memberCount}}"
}
```

**Variables:**

- `{{user}}`: User mention
- `{{username}}`: Username
- `{{server}}`: Server name
- `{{memberCount}}`: Total members
- `{{joinedAt}}`: Account creation date

**Use Cases:**

- Member onboarding
- Community building
- Auto-role assignment
- Departure tracking

**Best Practices:**

- Keep messages friendly
- Include important links
- Auto-delete to reduce clutter
- Assign starter roles

## Custom Command Prefixes

Configure custom bot command prefixes.

```json
{
  "action": "set-prefix",
  "channel": "discord",
  "guildId": "999",
  "prefix": "!",
  "allowMention": true
}
```

```json
{
  "action": "get-prefix",
  "channel": "discord",
  "guildId": "999"
}
```

**Parameters:**

- `prefix`: Command prefix string (1-10 chars)
- `allowMention`: Allow @bot mention as prefix

**Use Cases:**

- Bot customization
- Multi-bot environments
- User preference
- Conflict resolution

**Best Practices:**

- Document prefix in channel topics
- Support mention prefix
- Allow per-guild customization

## Reaction Roles

Role assignment via message reactions.

```json
{
  "action": "create-reaction-role",
  "channel": "discord",
  "guildId": "999",
  "channelId": "roles-123",
  "messageId": "456",
  "reactions": [
    { "emoji": "🎮", "roleId": "gamer-role" },
    { "emoji": "💻", "roleId": "developer-role" },
    { "emoji": "🎨", "roleId": "artist-role" }
  ],
  "removeOnUnreact": true,
  "uniqueRoles": false
}
```

**Parameters:**

- `reactions`: Array of emoji-role mappings
- `removeOnUnreact`: Remove role when unreacting
- `uniqueRoles`: Only allow one role from set
- `verificationRequired`: Require account age/verification

**Use Cases:**

- Self-service role assignment
- Interest-based roles
- Access control
- Community segmentation

**Best Practices:**

- Clear instructions message
- Limit role quantity
- Use unique roles for mutually exclusive options
- Visual emoji selection

## Suggestion System

Structured suggestion and voting.

```json
{
  "action": "create-suggestion",
  "channel": "discord",
  "guildId": "999",
  "channelId": "suggestions-123",
  "userId": "author-id",
  "title": "Add dark mode",
  "description": "Detailed suggestion description",
  "category": "feature",
  "attachments": ["mockup.png"]
}
```

**Suggestion Management:**

```json
{
  "action": "update-suggestion-status",
  "channel": "discord",
  "guildId": "999",
  "suggestionId": "suggestion-msg-id",
  "status": "approved",
  "staffNote": "Scheduled for v2.0",
  "notifyAuthor": true
}
```

**Statuses:**

- `pending`: Under review
- `approved`: Accepted
- `denied`: Rejected
- `implemented`: Completed
- `duplicate`: Already exists

**Use Cases:**

- Feature requests
- Community input
- Feedback collection
- Transparency

**Best Practices:**

- Dedicated suggestion channel
- Clear submission format
- Regular status updates
- Staff reasoning for decisions

## Ticket System

Support ticket creation and management.

```json
{
  "action": "create-ticket",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "category": "support",
  "priority": "medium",
  "subject": "Account issue"
}
```

**Ticket Categories:**

- `support`: General support
- `bug`: Bug reports
- `billing`: Billing questions
- `appeal`: Ban appeals

```json
{
  "action": "close-ticket",
  "channel": "discord",
  "ticketChannelId": "ticket-channel-id",
  "reason": "Issue resolved",
  "transcript": true,
  "archiveChannelId": "archive-channel-id"
}
```

**Parameters:**

- `category`: Ticket type
- `priority`: `low`, `medium`, `high`, `urgent`
- `transcript`: Save conversation
- `archiveChannelId`: Where to archive

**Use Cases:**

- Customer support
- Bug reporting
- Appeals process
- Private discussions

**Best Practices:**

- Auto-create private channels
- Transcript all tickets
- Priority-based assignment
- Response time tracking

## Leveling/XP System Integration

Experience and leveling hooks.

```json
{
  "action": "add-xp",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "amount": 10,
  "reason": "message"
}
```

```json
{
  "action": "get-rank",
  "channel": "discord",
  "guildId": "999",
  "userId": "123"
}
```

```json
{
  "action": "set-level-roles",
  "channel": "discord",
  "guildId": "999",
  "levelRoles": [
    { "level": 5, "roleId": "active-role" },
    { "level": 10, "roleId": "regular-role" },
    { "level": 25, "roleId": "veteran-role" }
  ]
}
```

**XP Sources:**

- Messages (with cooldown)
- Voice time
- Reactions received
- Custom events

**Use Cases:**

- Member engagement
- Reward systems
- Role progression
- Activity tracking

**Best Practices:**

- XP cooldowns to prevent spam
- Balanced XP rates
- Milestone rewards
- Leaderboard updates

## Analytics

Server and member activity analytics.

```json
{
  "action": "get-message-stats",
  "channel": "discord",
  "guildId": "999",
  "period": "7d",
  "breakdown": "channel"
}
```

```json
{
  "action": "get-member-activity",
  "channel": "discord",
  "guildId": "999",
  "userId": "123",
  "period": "30d"
}
```

**Metrics:**

- Message count by channel/user
- Voice time statistics
- Peak activity times
- Growth trends
- Retention rates

**Use Cases:**

- Server health monitoring
- Engagement analysis
- Moderation workload
- Growth tracking

**Best Practices:**

- Regular data collection
- Privacy considerations
- Visualize trends
- Actionable insights

---

# Utility Features

## Server Statistics Dashboard

Real-time server statistics.

```json
{
  "action": "create-stats-dashboard",
  "channel": "discord",
  "guildId": "999",
  "channelId": "stats-123",
  "refreshInterval": 300,
  "metrics": ["memberCount", "onlineCount", "boostCount", "messageCount24h", "voiceUsers"]
}
```

**Available Metrics:**

- Member counts (total, online, by role)
- Boost level and count
- Message statistics
- Voice activity
- Channel counts

**Use Cases:**

- Server showcase
- Growth tracking
- Engagement monitoring
- Transparency

**Best Practices:**

- Update at reasonable intervals
- Highlight key metrics
- Visual embeds with colors
- Auto-update mechanism

## Member Search/Filter

Advanced member queries.

```json
{
  "action": "search-members",
  "channel": "discord",
  "guildId": "999",
  "query": "john",
  "limit": 10
}
```

```json
{
  "action": "filter-members",
  "channel": "discord",
  "guildId": "999",
  "filters": {
    "roles": ["developer-role"],
    "joinedAfter": "2024-01-01",
    "hasNitro": true,
    "status": "online"
  }
}
```

**Filter Options:**

- Role membership
- Join date range
- Account age
- Nitro status
- Online status
- Activity status

**Use Cases:**

- Member management
- Role audits
- Targeted announcements
- List generation

**Best Practices:**

- Combine filters for precision
- Respect privacy
- Paginate large results

## Message Export

Export channel message history.

```json
{
  "action": "export-messages",
  "channel": "discord",
  "channelId": "123",
  "format": "json",
  "limit": 1000,
  "before": "2024-03-01",
  "after": "2024-01-01",
  "includeAttachments": true
}
```

**Formats:**

- `json`: Raw data
- `csv`: Spreadsheet format
- `html`: Readable archive
- `txt`: Plain text

**Use Cases:**

- Archival
- Data analysis
- Backup
- Migration

**Best Practices:**

- Export before major changes
- Store securely
- Include metadata
- Attachment handling

## Backup/Restore Channel Messages

Channel backup and restoration.

```json
{
  "action": "backup-channel",
  "channel": "discord",
  "channelId": "123",
  "includeSettings": true,
  "includePermissions": true,
  "includeMessages": true,
  "messageLimit": 10000
}
```

```json
{
  "action": "restore-channel",
  "channel": "discord",
  "channelId": "new-channel-id",
  "backupId": "backup-id",
  "restoreMessages": true,
  "restoreSettings": true,
  "restorePermissions": true
}
```

**Backup Contents:**

- Channel settings
- Permissions
- Messages
- Attachments
- Pins
- Webhooks

**Use Cases:**

- Disaster recovery
- Channel migration
- Testing environments
- Template creation

**Best Practices:**

- Regular backup schedule
- Verify backup integrity
- Test restore process
- Store backups securely

## Channel Clone

Duplicate channel structure.

```json
{
  "action": "clone-channel",
  "channel": "discord",
  "sourceChannelId": "123",
  "newName": "cloned-channel",
  "clonePermissions": true,
  "cloneSettings": true,
  "cloneMessages": false
}
```

**Cloned Elements:**

- Channel type and settings
- Permissions overwrites
- Topic and description
- Slowmode settings
- NSFW flag

**Use Cases:**

- Template channels
- Event channels
- Testing
- Quick setup

**Best Practices:**

- Update name to avoid confusion
- Clone permissions for consistency
- Don't clone messages by default

## Slowmode Management

Configure message rate limiting.

```json
{
  "action": "set-slowmode",
  "channel": "discord",
  "channelId": "123",
  "seconds": 5,
  "reason": "Reduce spam"
}
```

**Parameters:**

- `seconds`: Delay between messages (0-21600)
- 0 = disabled
- `exemptRoles`: Roles that bypass (optional)

**Use Cases:**

- Spam prevention
- Quality control
- Event management
- High-traffic channels

**Best Practices:**

- Start with low values
- Communicate clearly
- Exempt moderators
- Adjust based on activity

---

# Integration Features

## GitHub Webhook Integration

Format GitHub events for Discord.

```json
{
  "action": "format-github-event",
  "channel": "discord",
  "eventType": "push",
  "payload": {
    "repository": "owner/repo",
    "commits": [
      {
        "message": "Fix critical bug",
        "author": "developer",
        "sha": "abc123"
      }
    ],
    "branch": "main"
  }
}
```

**Event Types:**

- `push`: New commits
- `pull_request`: PR actions
- `issues`: Issue actions
- `release`: New releases
- `star`: Repository starred
- `fork`: Repository forked

**Format Example:**

```json
{
  "embeds": [
    {
      "author": {
        "name": "owner/repo",
        "icon_url": "github-icon-url"
      },
      "title": "[main] 3 new commits",
      "description": "`abc123` Fix critical bug - developer\n`def456` Update docs - contributor",
      "color": 5814783,
      "url": "commit-url"
    }
  ]
}
```

**Use Cases:**

- Development updates
- Release notifications
- Issue tracking
- Team coordination

**Best Practices:**

- Dedicated dev channels
- Filter noise (watch vs all)
- Link to GitHub
- Color code by event type

## CI/CD Notification Formatting

Format CI/CD pipeline results.

```json
{
  "action": "format-cicd-notification",
  "channel": "discord",
  "provider": "github-actions",
  "status": "success",
  "workflow": "Build and Test",
  "branch": "main",
  "commit": {
    "sha": "abc123",
    "message": "Update feature",
    "author": "developer"
  },
  "duration": "2m 30s",
  "url": "run-url"
}
```

**Statuses:**

- `success`: Green
- `failure`: Red
- `pending`: Yellow
- `cancelled`: Grey

**Format Example:**

```json
{
  "embeds": [
    {
      "title": "✅ Build and Test: Success",
      "description": "**Branch:** `main`\n**Commit:** `abc123` Update feature\n**Duration:** 2m 30s",
      "color": 3066993,
      "url": "run-url",
      "footer": {
        "text": "GitHub Actions"
      }
    }
  ]
}
```

**Use Cases:**

- Build notifications
- Deployment alerts
- Test results
- Pipeline monitoring

**Best Practices:**

- Color code by status
- Include commit info
- Link to logs
- Failure details in embeds

## Status Page Updates

Format status page incidents.

```json
{
  "action": "format-status-update",
  "channel": "discord",
  "incident": {
    "name": "API Degradation",
    "status": "investigating",
    "impact": "minor",
    "components": ["API", "Database"],
    "updates": [
      {
        "status": "investigating",
        "body": "We're investigating reports of slow API responses.",
        "timestamp": "2024-03-12T15:30:00Z"
      }
    ]
  }
}
```

**Statuses:**

- `investigating`: Yellow
- `identified`: Orange
- `monitoring`: Blue
- `resolved`: Green

**Impact Levels:**

- `none`: Grey
- `minor`: Yellow
- `major`: Orange
- `critical`: Red

**Use Cases:**

- Service status
- Incident updates
- Maintenance windows
- Uptime reports

**Best Practices:**

- Update in real-time
- Clear impact descriptions
- Timeline of events
- Link to status page

## Alert Formatting Patterns

Standardized alert formatting.

```json
{
  "action": "format-alert",
  "channel": "discord",
  "alertType": "error",
  "severity": "high",
  "service": "API Gateway",
  "message": "Response time exceeded threshold",
  "metrics": {
    "p95": "2500ms",
    "threshold": "1000ms",
    "affected": "15% of requests"
  },
  "timestamp": "2024-03-12T15:30:00Z",
  "runbook": "https://docs.example.com/runbooks/high-latency"
}
```

**Alert Types:**

- `error`: Red
- `warning`: Yellow
- `info`: Blue
- `success`: Green

**Format Example:**

```json
{
  "embeds": [
    {
      "title": "🚨 High Severity Alert: API Gateway",
      "description": "Response time exceeded threshold",
      "color": 15158332,
      "fields": [
        { "name": "P95 Latency", "value": "2500ms", "inline": true },
        { "name": "Threshold", "value": "1000ms", "inline": true },
        { "name": "Impact", "value": "15% of requests", "inline": true }
      ],
      "footer": {
        "text": "Runbook: docs.example.com/runbooks/high-latency"
      },
      "timestamp": "2024-03-12T15:30:00Z"
    }
  ],
  "components": [
    {
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 4,
          "label": "View Runbook",
          "url": "https://docs.example.com/runbooks/high-latency"
        }
      ]
    }
  ]
}
```

**Use Cases:**

- System monitoring
- Error alerts
- Performance issues
- Security events

**Best Practices:**

- Severity-based colors
- Include metrics
- Link to runbooks
- Action buttons
- Timestamp all alerts

---

# Rate Limits & Best Practices

## Rate Limit Guidelines

Discord enforces rate limits to prevent abuse. Plan operations accordingly.

**Global Limits:**

- 50 requests per second across all endpoints
- Cloudflare blocks above limits (HTTP 429)

**Per-Route Limits:**

- Sending messages: 5 per 5 seconds per channel
- Deleting messages: 5 per second
- Adding reactions: 1 per 0.25 seconds
- Member modifications: 10 per 10 seconds

**Best Practices:**

- Implement exponential backoff
- Batch operations when possible
- Cache frequently accessed data
- Monitor `X-RateLimit` headers
- Use webhooks for high-volume messaging

## Permission Checking

Always verify permissions before operations.

```json
{
  "action": "check-permissions",
  "channel": "discord",
  "guildId": "999",
  "channelId": "123",
  "userId": "bot-id",
  "permissions": ["SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS"]
}
```

**Critical Permissions:**

- `SEND_MESSAGES`: Send messages
- `EMBED_LINKS`: Send embeds
- `ATTACH_FILES`: Send attachments
- `MANAGE_MESSAGES`: Delete/pin messages
- `MANAGE_ROLES`: Assign roles
- `KICK_MEMBERS`: Kick users
- `BAN_MEMBERS`: Ban users
- `ADMINISTRATOR`: Full access (dangerous)

**Best Practices:**

- Check before each operation
- Graceful error handling
- Request minimal permissions
- Document required permissions

## Error Handling

Robust error handling for reliability.

**Common Errors:**

- `50001`: Missing Access
- `50013`: Missing Permissions
- `10008`: Unknown Message
- `10003`: Unknown Channel
- `30003`: Maximum Pins
- `30005`: Maximum Reactions

**Best Practices:**

- Parse error codes
- User-friendly messages
- Retry transient errors
- Log for debugging
- Fallback mechanisms

## Security Considerations

Protect tokens and sensitive data.

**Token Security:**

- Never commit tokens
- Use environment variables
- Rotate compromised tokens
- Limit token scope

**User Privacy:**

- Respect privacy settings
- Minimal data collection
- Clear data retention
- GDPR compliance

**Best Practices:**

- Validate all inputs
- Sanitize user content
- Rate limit user actions
- Audit permission usage
- Regular security reviews

---

## Writing Style (Discord)

- Short, conversational, low ceremony.
- No markdown tables.
- Mention users as `<@USER_ID>`.
- Use embeds for structured data.
- Buttons for common actions.
- Keep messages under 2000 characters.
- Split long content into multiple messages or embeds.
