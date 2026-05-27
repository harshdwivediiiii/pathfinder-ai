"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateUserSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const DEFAULT_SETTINGS = {
  notifications: true,
  emailAlerts: true,
};

export default function SettingsClient({ userId, settings }) {
  const initialSettings = useMemo(
    () => ({
      notifications: settings?.notifications ?? DEFAULT_SETTINGS.notifications,
      emailAlerts: settings?.emailAlerts ?? DEFAULT_SETTINGS.emailAlerts,
    }),
    [settings]
  );

  const [form, setForm] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    form.notifications !== savedSettings.notifications ||
    form.emailAlerts !== savedSettings.emailAlerts;

  function handleToggle(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const previousSettings = savedSettings;
    const nextSettings = {
      notifications: form.notifications,
      emailAlerts: form.emailAlerts,
    };

    setSavedSettings(nextSettings);

    startTransition(async () => {
      try {
        const updatedSettings = await updateUserSettings(userId, nextSettings);
        const normalizedSettings = {
          notifications: updatedSettings.notifications,
          emailAlerts: updatedSettings.emailAlerts,
        };

        setForm(normalizedSettings);
        setSavedSettings(normalizedSettings);
        toast.success("Settings saved.");
      } catch (error) {
        setForm(previousSettings);
        setSavedSettings(previousSettings);
        toast.error(error.message || "Failed to save settings.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notifications">Enable Notifications</Label>
            <Switch
              id="notifications"
              checked={form.notifications}
              disabled={isPending}
              onCheckedChange={(checked) =>
                handleToggle("notifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="emailAlerts">Email Alerts</Label>
            <Switch
              id="emailAlerts"
              checked={form.emailAlerts}
              disabled={isPending}
              onCheckedChange={(checked) =>
                handleToggle("emailAlerts", checked)
              }
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending || !hasChanges}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
