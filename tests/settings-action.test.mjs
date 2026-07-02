import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  userSettingsFindUnique: vi.fn(),
  userSettingsUpsert: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/user", () => ({
  getUserByClerkId: mocks.getUserByClerkId,
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    userSettings: {
      findUnique: mocks.userSettingsFindUnique,
      upsert: mocks.userSettingsUpsert,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getUserSettings, updateUserSettings } from "../actions/settings.js";

describe("Settings Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully retrieves user settings", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1" });
    mocks.userSettingsFindUnique.mockResolvedValue({
      notifications: true,
      emailAlerts: false,
      largeButtonsMode: true,
    });

    const result = await getUserSettings();

    expect(result.notifications).toBe(true);
    expect(result.emailAlerts).toBe(false);
    expect(result.largeButtonsMode).toBe(true);
  });

  it("successfully updates user settings", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-user-1" });
    mocks.userSettingsUpsert.mockResolvedValue({
      notifications: false,
      emailAlerts: true,
    });

    const data = {
      notifications: false,
      emailAlerts: true,
    };

    const result = await updateUserSettings(data);

    expect(result.success).toBe(true);
    expect(result.settings.notifications).toBe(false);
    expect(result.settings.emailAlerts).toBe(true);
  });
});
