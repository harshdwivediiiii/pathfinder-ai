"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Briefcase, Code, Clock, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  currentSkills: z.string().min(2, "Please enter your current skills.").max(1000, "Current skills must be less than 1000 characters."),
  targetRole: z.string().min(2, "Please enter your target role.").max(200, "Target role must be less than 200 characters."),
  jobDescription: z.string().max(3000, "Job description must be less than 3000 characters.").optional(),
  learningDuration: z.string().min(1, "Please select a learning duration.").max(100, "Learning duration must be less than 100 characters."),
});

export default function SkillGapForm({ onSubmit, isGenerating }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentSkills: "",
      targetRole: "",
      jobDescription: "",
      learningDuration: "1 month",
    },
  });

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-primary/10">
      <CardHeader className="bg-gradient-to-b from-primary/5 to-transparent pb-8">
        <CardTitle className="text-2xl font-bold">New Skill Gap Analysis</CardTitle>
        <CardDescription>
          Enter your current skills and target role to generate a personalized learning roadmap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-primary" />
                    Current Skills
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. JavaScript, React, Node.js, basic SQL"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List your current skills, tools, and technologies.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="targetRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Target Role
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Full Stack Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learningDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Learning Duration
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2 weeks">2 weeks</SelectItem>
                        <SelectItem value="1 month">1 month</SelectItem>
                        <SelectItem value="2 months">2 months</SelectItem>
                        <SelectItem value="3 months">3 months</SelectItem>
                        <SelectItem value="6 months">6 months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-primary" />
                    Job Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste a specific job description to tailor the analysis..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    If you have a specific job in mind, paste the requirements here.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Skills...
                </>
              ) : (
                "Generate Learning Plan"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
