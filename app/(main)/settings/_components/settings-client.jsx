"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateUser } from "@/actions/user";
import { updateUserSettings } from "@/actions/settings";
import { buildUserProfileContext } from "@/lib/ai-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const DEFAULT_SETTINGS = {
  notifications: true,
  emailAlerts: true,
};

const DEFAULT_PROFILE = {
  currentRole: "",
  targetRole: "",
  careerGoals: "",
  industry: "",
  experience: "",
  bio: "",
  skills: "",
};

const parseSkills = (value) =>
  value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

export default function SettingsClient({ userId, user, settings }) {
  const initialSettings = useMemo(
    () => ({
      notifications: settings?.notifications ?? DEFAULT_SETTINGS.notifications,
      emailAlerts: settings?.emailAlerts ?? DEFAULT_SETTINGS.emailAlerts,
    }),
    [settings]
  );

  const initialProfile = useMemo(
    () => ({
      currentRole: user?.currentRole ?? DEFAULT_PROFILE.currentRole,
      targetRole: user?.targetRole ?? DEFAULT_PROFILE.targetRole,
      careerGoals: user?.careerGoals ?? DEFAULT_PROFILE.careerGoals,
      industry: user?.industry ?? DEFAULT_PROFILE.industry,
      experience: user?.experience?.toString() ?? DEFAULT_PROFILE.experience,
      bio: user?.bio ?? DEFAULT_PROFILE.bio,
      skills: Array.isArray(user?.skills) ? user.skills.join(", ") : DEFAULT_PROFILE.skills,
    }),
    [user]
  );

  const [form, setForm] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [profileForm, setProfileForm] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [isProfilePending, startProfileTransition] = useTransition();

  const hasChanges =
    form.notifications !== savedSettings.notifications ||
    form.emailAlerts !== savedSettings.emailAlerts;

  const hasProfileChanges =
    profileForm.currentRole !== savedProfile.currentRole ||
    profileForm.targetRole !== savedProfile.targetRole ||
    profileForm.careerGoals !== savedProfile.careerGoals ||
    profileForm.industry !== savedProfile.industry ||
    profileForm.experience !== savedProfile.experience ||
    profileForm.bio !== savedProfile.bio ||
    profileForm.skills !== savedProfile.skills;

  function handleToggle(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleProfileChange(key, value) {
    setProfileForm((current) => ({ ...current, [key]: value }));
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
        const result = await updateUserSettings(nextSettings);
        if (!result.success) {
          throw new Error(result.error || "Failed to save settings.");
        }
        const normalizedSettings = {
          notifications: result.settings.notifications,
          emailAlerts: result.settings.emailAlerts,
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

  function handleProfileSave() {
    const previousProfile = savedProfile;
    const nextProfile = { ...profileForm };

    setSavedProfile(nextProfile);

    startProfileTransition(async () => {
      try {
        const result = await updateUser({
          industry: nextProfile.industry,
          currentRole: nextProfile.currentRole || null,
          targetRole: nextProfile.targetRole || null,
          careerGoals: nextProfile.careerGoals || null,
          experience: nextProfile.experience ? Number(nextProfile.experience) : null,
          bio: nextProfile.bio || null,
          skills: parseSkills(nextProfile.skills),
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to save profile.");
        }

        const updatedUser = result.user;

        const normalizedProfile = {
          currentRole: updatedUser.currentRole ?? "",
          targetRole: updatedUser.targetRole ?? "",
          careerGoals: updatedUser.careerGoals ?? "",
          industry: updatedUser.industry ?? "",
          experience: updatedUser.experience?.toString() ?? "",
          bio: updatedUser.bio ?? "",
          skills: Array.isArray(updatedUser.skills) ? updatedUser.skills.join(", ") : "",
        };

        setProfileForm(normalizedProfile);
        setSavedProfile(normalizedProfile);
        toast.success("Profile saved.");
      } catch (error) {
        setProfileForm(previousProfile);
        setSavedProfile(previousProfile);
        toast.error(error.message || "Failed to save profile.");
      }
    });
  }

  const previewContext = buildUserProfileContext({
    name: user?.name,
    currentRole: profileForm.currentRole,
    industry: profileForm.industry,
    experience: profileForm.experience,
    targetRole: profileForm.targetRole,
    skills: parseSkills(profileForm.skills),
    careerGoals: profileForm.careerGoals,
  });

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Edit the profile that powers every AI prompt and keep the chat behavior tuned to your goals.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>AI Profile Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentRole">Current Role</Label>
                <Input
                  id="currentRole"
                  value={profileForm.currentRole}
                  disabled={isProfilePending}
                  onChange={(event) => handleProfileChange("currentRole", event.target.value)}
                  placeholder="e.g. Product Designer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input
                  id="targetRole"
                  value={profileForm.targetRole}
                  disabled={isProfilePending}
                  onChange={(event) => handleProfileChange("targetRole", event.target.value)}
                  placeholder="e.g. Staff Product Designer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={profileForm.industry}
                  disabled={isProfilePending}
                  onChange={(event) => handleProfileChange("industry", event.target.value)}
                  placeholder="e.g. Healthcare"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={profileForm.experience}
                  disabled={isProfilePending}
                  onChange={(event) => handleProfileChange("experience", event.target.value)}
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                value={profileForm.skills}
                disabled={isProfilePending}
                onChange={(event) => handleProfileChange("skills", event.target.value)}
                placeholder="React, TypeScript, Product Strategy"
                className="min-h-[110px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="careerGoals">Career Goals</Label>
              <Textarea
                id="careerGoals"
                value={profileForm.careerGoals}
                disabled={isProfilePending}
                onChange={(event) => handleProfileChange("careerGoals", event.target.value)}
                placeholder="Describe the direction you want your AI coach to optimize for"
                className="min-h-[110px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                disabled={isProfilePending}
                onChange={(event) => handleProfileChange("bio", event.target.value)}
                placeholder="A short professional summary"
                className="min-h-[110px]"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleProfileSave} disabled={isProfilePending || !hasProfileChanges}>
                {isProfilePending ? "Saving profile..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Debug Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground overflow-x-auto">
                {previewContext}
              </pre>
            </CardContent>
          </Card>

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
                  {isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
