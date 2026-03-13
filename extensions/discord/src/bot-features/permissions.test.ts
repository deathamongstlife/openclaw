import type { GuildMember, PermissionsBitField, Guild } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { DiscordBotStore } from "../database/store.js";
import { PermissionManager } from "./permissions.js";

describe("PermissionManager", () => {
  let manager: PermissionManager;
  let mockStore: DiscordBotStore;

  beforeEach(() => {
    mockStore = {
      getServerConfig: vi.fn().mockResolvedValue({
        guildId: "test-guild",
        modRoles: ["mod-role-1", "mod-role-2"],
      }),
    } as any;

    manager = new PermissionManager(mockStore);
  });

  describe("hasModPermission", () => {
    it("should return true for administrator", async () => {
      const member = {
        guild: { id: "test-guild" },
        permissions: {
          has: vi.fn().mockReturnValue(true),
        },
        roles: {
          cache: new Map(),
        },
      } as unknown as GuildMember;

      const result = await manager.hasModPermission(member);
      expect(result).toBe(true);
      expect(member.permissions.has).toHaveBeenCalledWith(PermissionFlagsBits.Administrator);
    });

    it("should return true for user with mod role", async () => {
      const member = {
        guild: { id: "test-guild" },
        permissions: {
          has: vi.fn().mockReturnValue(false),
        },
        roles: {
          cache: new Map([["mod-role-1", { id: "mod-role-1", name: "Moderator" }]]),
        },
      } as unknown as GuildMember;

      const result = await manager.hasModPermission(member);
      expect(result).toBe(true);
    });

    it("should return false for regular user", async () => {
      const member = {
        guild: { id: "test-guild" },
        permissions: {
          has: vi.fn().mockReturnValue(false),
        },
        roles: {
          cache: new Map(),
        },
      } as unknown as GuildMember;

      const result = await manager.hasModPermission(member);
      expect(result).toBe(false);
    });
  });

  describe("canModerateUser", () => {
    it("should return false for same user", async () => {
      const member = {
        id: "user-1",
        guild: { id: "test-guild" },
      } as unknown as GuildMember;

      const result = await manager.canModerateUser(member, member);
      expect(result).toBe(false);
    });

    it("should return false when role hierarchy prevents moderation", async () => {
      const moderator = {
        id: "mod-1",
        guild: { id: "test-guild" },
        permissions: { has: vi.fn().mockReturnValue(true) },
        roles: {
          cache: new Map(),
          highest: { position: 5 },
        },
      } as unknown as GuildMember;

      const target = {
        id: "user-1",
        guild: { id: "test-guild" },
        roles: {
          highest: { position: 10 },
        },
      } as unknown as GuildMember;

      const result = await manager.canModerateUser(moderator, target);
      expect(result).toBe(false);
    });

    it("should return true when conditions are met", async () => {
      const moderator = {
        id: "mod-1",
        guild: { id: "test-guild" },
        permissions: { has: vi.fn().mockReturnValue(true) },
        roles: {
          cache: new Map(),
          highest: { position: 10 },
        },
      } as unknown as GuildMember;

      const target = {
        id: "user-1",
        guild: { id: "test-guild" },
        roles: {
          highest: { position: 5 },
        },
      } as unknown as GuildMember;

      const result = await manager.canModerateUser(moderator, target);
      expect(result).toBe(true);
    });
  });
});
