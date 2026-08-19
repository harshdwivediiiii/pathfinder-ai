"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updatePortfolio } from "@/actions/portfolio-builder";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";

export default function PortfolioContentEditor({ portfolio, onUpdate }) {
  const [content, setContent] = useState(portfolio?.content || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(portfolio?.content || {});
  }, [portfolio?.content]);

  const handleSave = async () => {
    setSaving(true);
    toast.loading("Saving content...", { id: "save-content" });
    const res = await updatePortfolio({ content });
    if (res.success) {
      toast.success("Content saved successfully!", { id: "save-content" });
      onUpdate(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to save.", { id: "save-content" });
    }
    setSaving(false);
  };

  const updateHero = (field, value) => {
    setContent(prev => ({
      ...prev,
      hero: { ...(prev.hero || {}), [field]: value }
    }));
  };

  const updateAbout = (value) => {
    setContent(prev => ({
      ...prev,
      about: { ...(prev.about || {}), content: value }
    }));
  };

  const updateExperience = (index, field, value) => {
    setContent(prev => {
      const newExp = [...(prev.experience || [])];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  const addExperience = () => {
    setContent(prev => ({
      ...prev,
      experience: [...(prev.experience || []), { company: "", role: "", duration: "", description: "" }]
    }));
  };

  const removeExperience = (index) => {
    setContent(prev => {
      const newExp = [...(prev.experience || [])];
      newExp.splice(index, 1);
      return { ...prev, experience: newExp };
    });
  };

  const updateProject = (index, field, value) => {
    setContent(prev => {
      const newProj = [...(prev.projects || [])];
      if (field === 'techStack') {
        newProj[index] = { ...newProj[index], [field]: value.split(',').map(s => s.trim()).filter(Boolean) };
      } else {
        newProj[index] = { ...newProj[index], [field]: value };
      }
      return { ...prev, projects: newProj };
    });
  };

  const addProject = () => {
    setContent(prev => ({
      ...prev,
      projects: [...(prev.projects || []), { name: "", description: "", link: "", image: "", techStack: [] }]
    }));
  };

  const removeProject = (index) => {
    setContent(prev => {
      const newProj = [...(prev.projects || [])];
      newProj.splice(index, 1);
      return { ...prev, projects: newProj };
    });
  };

  const updateSkills = (value) => {
    setContent(prev => ({
      ...prev,
      skills: value.split(',').map(s => s.trim()).filter(Boolean)
    }));
  };

  return (
    <div className="space-y-8 pb-4">
      {/* Hero Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">Hero Section</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="hero-headline" className="text-xs font-semibold text-muted-foreground uppercase">Headline</label>
            <Input 
              id="hero-headline"
              value={content.hero?.headline || ""} 
              onChange={e => updateHero("headline", e.target.value)} 
              placeholder="e.g. Full Stack Developer" 
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="hero-subheadline" className="text-xs font-semibold text-muted-foreground uppercase">Subheadline</label>
            <Textarea 
              id="hero-subheadline"
              value={content.hero?.subheadline || ""} 
              onChange={e => updateHero("subheadline", e.target.value)} 
              placeholder="A brief summary about yourself" 
              className="resize-none h-20"
            />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">About Section</h3>
        <div className="space-y-1">
          <label htmlFor="about-content" className="text-xs font-semibold text-muted-foreground uppercase">Content</label>
          <Textarea 
            id="about-content"
            value={content.about?.content || ""} 
            onChange={e => updateAbout(e.target.value)} 
            placeholder="Detailed professional bio" 
            className="min-h-[120px]"
          />
        </div>
      </div>

      {/* Experience Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-bold text-lg">Experience</h3>
          <Button variant="outline" size="sm" onClick={addExperience} className="h-8 gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        
        <div className="space-y-4">
          {(content.experience || []).map((exp, i) => (
            <div key={i} className="p-4 border border-border rounded-xl space-y-3 bg-muted/20 relative group">
              <button 
                onClick={() => removeExperience(i)}
                aria-label={`Remove experience ${i + 1}`}
                className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-background transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-3 pr-8">
                <div className="space-y-1">
                  <label htmlFor={`exp-role-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Role</label>
                  <Input id={`exp-role-${i}`} value={exp.role || ""} onChange={e => updateExperience(i, "role", e.target.value)} placeholder="e.g. Frontend Engineer" />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`exp-company-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Company</label>
                  <Input id={`exp-company-${i}`} value={exp.company || ""} onChange={e => updateExperience(i, "company", e.target.value)} placeholder="Company Name" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label htmlFor={`exp-duration-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Duration</label>
                  <Input id={`exp-duration-${i}`} value={exp.duration || ""} onChange={e => updateExperience(i, "duration", e.target.value)} placeholder="e.g. Jan 2020 - Present" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label htmlFor={`exp-desc-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                  <Textarea id={`exp-desc-${i}`} value={exp.description || ""} onChange={e => updateExperience(i, "description", e.target.value)} placeholder="What did you do?" />
                </div>
              </div>
            </div>
          ))}
          {(!content.experience || content.experience.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No experience added.</p>
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-bold text-lg">Projects</h3>
          <Button variant="outline" size="sm" onClick={addProject} className="h-8 gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        
        <div className="space-y-4">
          {(content.projects || []).map((proj, i) => (
            <div key={i} className="p-4 border border-border rounded-xl space-y-3 bg-muted/20 relative group">
              <button 
                onClick={() => removeProject(i)}
                aria-label={`Remove project ${i + 1}`}
                className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-background transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-3 pr-8">
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label htmlFor={`proj-name-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                  <Input id={`proj-name-${i}`} value={proj.name || ""} onChange={e => updateProject(i, "name", e.target.value)} placeholder="Project Name" />
                </div>
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label htmlFor={`proj-link-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Link URL</label>
                  <Input id={`proj-link-${i}`} value={proj.link || ""} onChange={e => updateProject(i, "link", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1 col-span-2">
                  <label htmlFor={`proj-img-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Image URL (Optional)</label>
                  <Input id={`proj-img-${i}`} value={proj.image || ""} onChange={e => updateProject(i, "image", e.target.value)} placeholder="https://.../image.png" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label htmlFor={`proj-tech-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Tech Stack (comma separated)</label>
                  <Input id={`proj-tech-${i}`} value={(proj.techStack || []).join(', ')} onChange={e => updateProject(i, "techStack", e.target.value)} placeholder="React, Node.js, Tailwind" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label htmlFor={`proj-desc-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                  <Textarea id={`proj-desc-${i}`} value={proj.description || ""} onChange={e => updateProject(i, "description", e.target.value)} placeholder="About the project..." />
                </div>
              </div>
            </div>
          ))}
          {(!content.projects || content.projects.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No projects added.</p>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">Skills</h3>
        <div className="space-y-1">
          <label htmlFor="skills-content" className="text-xs font-semibold text-muted-foreground uppercase">Comma Separated Skills</label>
          <Textarea 
            id="skills-content"
            value={(content.skills || []).join(', ')} 
            onChange={e => updateSkills(e.target.value)} 
            placeholder="React, Next.js, JavaScript..." 
            className="h-24"
          />
        </div>
      </div>

      <div className="sticky bottom-0 pt-4 bg-card border-t mt-4 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2 text-md h-11 rounded-xl">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </div>
  );
}
