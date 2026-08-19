"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, User, Briefcase, GraduationCap, Award, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { onboardingSchema } from "@/app/lib/schema";
import { updateUser } from "@/actions/user";
import { cn } from "@/lib/misc/utils";
import LinkedinImportButton from "@/components/linkedin-import-button";

const BIO_MAX = 500;

const getQualityHint = (length, max) => {
  if (length === 0) return null;
  if (length > max) return { text: "Too long", color: "text-destructive" };
  if (length < 30) return { text: "Needs detail", color: "text-muted-foreground" };
  if (length < 100) return { text: "Getting there", color: "text-primary/70" };
  return { text: "Perfect!", color: "text-emerald-500 font-bold" };
};

const OnboardingForm = ({ industries }) => {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [bioLength, setBioLength] = useState(0);

  const {
    loading: updateLoading,
    fn: updateUserFn,
    data: updateResult,
    error: updateError,
  } = useFetch(updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (values) => {
    if (bioLength > BIO_MAX) {
      toast.error("Please shorten your bio before submitting.");
      return;
    }
    try {
      const formattedIndustry = `${values.industry}-${(values.subIndustry || "")
        .toLowerCase()
        .replace(/ /g, "-")}`;
      const { subIndustry, ...cleanValues } = values;
      await updateUserFn({ ...cleanValues, industry: formattedIndustry });
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete onboarding. Please try again.");
    }
  };

  useEffect(() => {
    if (updateResult && !updateLoading) {
      toast.success("Profile built successfully!");
      router.replace("/dashboard");
      router.refresh();
    }
  }, [updateResult, updateLoading, router]);

  const handleImportComplete = (data) => {
    if (data.currentRole) setValue("currentRole", data.currentRole);
    if (data.bio) {
      setValue("bio", data.bio);
      setBioLength(data.bio.length);
    }
    if (data.experience) setValue("experience", data.experience.toString());
    if (data.skills && data.skills.length > 0) setValue("skills", data.skills.join(", "));
    // Note: Industry dropdown might need manual selection if it doesn't strictly match the predefined lists,
    // but the bio, skills, role, and experience will be filled in, saving a lot of time.
  };

  const watchIndustry = watch("industry");
  const bioHint = getQualityHint(bioLength, BIO_MAX);
  const isOverLimit = bioLength > BIO_MAX;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/30 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
      >
        <Card className="rounded-[2.5rem] border-border shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 w-full" />
          
          <CardHeader className="p-8 md:p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
                Build Your <span className="text-gradient-primary">AI Profile</span>
              </CardTitle>
              <CardDescription className="text-base md:text-lg font-medium text-muted-foreground">
                Let&apos;s personalize your career journey with precision data.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-8 md:p-12 pt-0">
            <div className="flex justify-center mb-8 pb-8 border-b border-border border-dashed">
              <LinkedinImportButton 
                variant="outline" 
                className="w-full max-w-sm rounded-xl h-12 shadow-sm"
                onImportComplete={handleImportComplete} 
              />
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industry Selection */}
                <div className="space-y-3">
                  <Label htmlFor="industry" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-primary" />
                    Industry
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("industry", value);
                      setSelectedIndustry(industries.find((ind) => ind.id === value));
                      setValue("subIndustry", "");
                    }}
                  >
                    <SelectTrigger id="industry" className="h-12 rounded-xl bg-background/50 border-border focus:ring-primary/20">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      <SelectGroup>
                        <SelectLabel>Available Sectors</SelectLabel>
                        {industries.map((ind) => (
                          <SelectItem key={ind.id} value={ind.id} className="rounded-lg m-1">
                            {ind.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">{errors.industry.message}</p>
                  )}
                </div>

                {/* Sub-Industry Selection */}
                <AnimatePresence mode="wait">
                  {watchIndustry ? (
                    <motion.div
                      key="subIndustry"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      <Label htmlFor="subIndustry" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <GraduationCap className="h-3 w-3 text-primary" />
                        Specialization
                      </Label>
                      <Select onValueChange={(value) => setValue("subIndustry", value)}>
                        <SelectTrigger id="subIndustry" className="h-12 rounded-xl bg-background/50 border-border">
                          <SelectValue placeholder="Select Specialization" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-xl">
                          <SelectGroup>
                            <SelectLabel>Sub-sectors</SelectLabel>
                            {selectedIndustry?.subIndustries.map((sub) => (
                              <SelectItem key={sub} value={sub} className="rounded-lg m-1">
                                {sub}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errors.subIndustry && (
                        <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">{errors.subIndustry.message}</p>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-[76px] rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select industry first</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="currentRole" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" />
                    Current Role
                  </Label>
                  <Input
                    id="currentRole"
                    placeholder="e.g. Full Stack Developer"
                    className="h-12 rounded-xl bg-background/50 border-border"
                    {...register("currentRole")}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="targetRole" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-primary" />
                    Target Role
                  </Label>
                  <Input
                    id="targetRole"
                    placeholder="e.g. Senior Backend Engineer"
                    className="h-12 rounded-xl bg-background/50 border-border"
                    {...register("targetRole")}
                  />
                  {errors.targetRole && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">{errors.targetRole.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience */}
                <div className="space-y-3">
                  <Label htmlFor="experience" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Award className="h-3 w-3 text-primary" />
                    Years Experience
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="e.g. 5"
                    className="h-12 rounded-xl bg-background/50 border-border"
                    {...register("experience")}
                  />
                  {errors.experience && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">{errors.experience.message}</p>
                  )}
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <Label htmlFor="skills" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Key Skills
                  </Label>
                  <Input
                    id="skills"
                    placeholder="e.g. React, Python, UI Design"
                    className="h-12 rounded-xl bg-background/50 border-border"
                    {...register("skills")}
                  />
                  {errors.skills && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">{errors.skills.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="careerGoals" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Career Goals
                </Label>
                <Textarea
                  id="careerGoals"
                  placeholder="What role, growth, or transition are you working toward?"
                  className="h-28 rounded-2xl bg-background/50 border-border focus:ring-primary/20 p-4 leading-relaxed"
                  {...register("careerGoals")}
                />
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" />
                    Professional Bio
                  </Label>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isOverLimit ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {bioLength} / {BIO_MAX}
                  </span>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Summarize your professional journey and key achievements..."
                  className={cn(
                    "h-40 rounded-2xl bg-background/50 border-border focus:ring-primary/20 p-4 leading-relaxed",
                    isOverLimit && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("bio", {
                    onChange: (e) => setBioLength(e.target.value.length),
                  })}
                />
                <div className="flex justify-end">
                  {bioHint && (
                    <span className={cn("text-[10px] uppercase tracking-widest font-bold", bioHint.color)}>
                      {bioHint.text}
                    </span>
                  )}
                </div>
                {errors.bio && (
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">{errors.bio.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 group"
                disabled={updateLoading || isOverLimit}
              >
                {updateLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Finalize Profile
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingForm;
