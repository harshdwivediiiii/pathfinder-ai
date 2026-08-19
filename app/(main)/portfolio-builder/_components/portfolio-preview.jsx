"use client";

import { motion } from "framer-motion";
import { Mail, Github, Linkedin, ExternalLink } from "lucide-react";

export default function PortfolioPreview({ data, theme, user }) {
  if (!data) return null;

  // Modern Theme (Dark with neon accents)
  if (theme === "modern") {
    return (
      <div className="w-full h-full overflow-y-auto custom-scrollbar bg-slate-950 text-slate-50 font-sans">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-20">
          
          {/* Hero */}
          <section className="space-y-6 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide">
              {user?.name || "Portfolio"}
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-extrabold tracking-tight">
              {data.hero?.headline || "Welcome to my portfolio"}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-slate-400 max-w-2xl">
              {data.hero?.subheadline}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-4 justify-center md:justify-start pt-4">
              {user?.email && (
                <a href={`mailto:${user.email}`} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </motion.div>
          </section>

          {/* About */}
          {data.about?.content && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-8 h-[2px] bg-blue-500"></span> About
              </h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                {data.about.content}
              </p>
            </section>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-8 h-[2px] bg-purple-500"></span> Experience
              </h2>
              <div className="space-y-8">
                {data.experience.map((exp, i) => (
                  <div key={i} className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2 before:w-[2px] before:h-full before:bg-slate-800 last:before:h-0">
                    <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full bg-purple-500 outline outline-4 outline-slate-950"></div>
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                        <h3 className="text-xl font-bold text-slate-200">{exp.role}</h3>
                        <span className="text-sm font-mono text-purple-400">{exp.duration}</span>
                      </div>
                      <p className="text-lg font-medium text-slate-400">{exp.company}</p>
                      <p className="text-slate-500">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-8 h-[2px] bg-green-500"></span> Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.projects.map((proj, i) => (
                  <div key={i} className={`group flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-green-500/50 transition-colors overflow-hidden ${!proj.image ? 'md:col-span-2' : ''}`}>
                    {proj.image && (
                      <div className="w-full h-48 bg-slate-800 overflow-hidden">
                        <img src={proj.image} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold flex items-center justify-between">
                        {proj.name}
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noreferrer" aria-label={`Visit project ${proj.name}`} className="opacity-70 hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-5 w-5 text-green-400" />
                          </a>
                        )}
                      </h3>
                      <p className="text-slate-400 flex-1">{proj.description}</p>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-800/50">
                          {proj.techStack.map((tech, j) => (
                            <span key={j} className="text-xs font-mono px-2 py-1 bg-slate-800/80 text-green-400 rounded-md">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section className="space-y-6 pb-20">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-8 h-[2px] bg-orange-500"></span> Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // Minimal Theme (Clean, white/light mode)
  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-white text-zinc-900 font-serif">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-24">
        
        {/* Hero */}
        <section className="space-y-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-medium text-zinc-800">
            {data.hero?.headline || "Welcome"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-zinc-500 font-sans max-w-xl mx-auto leading-relaxed">
            {data.hero?.subheadline}
          </motion.p>
        </section>

        {/* About */}
        {data.about?.content && (
          <section className="space-y-6 text-center md:text-left">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">About</h2>
            <p className="text-zinc-600 leading-relaxed text-lg">
              {data.about.content}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <section className="space-y-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans border-b border-zinc-100 pb-4">Experience</h2>
            <div className="space-y-12">
              {data.experience.map((exp, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-zinc-400 font-sans text-sm pt-1">{exp.duration}</div>
                  <div className="md:col-span-3 space-y-2">
                    <h3 className="text-xl font-medium text-zinc-800">{exp.role}</h3>
                    <p className="font-sans text-zinc-500 font-medium">{exp.company}</p>
                    <p className="text-zinc-600 leading-relaxed mt-2">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <section className="space-y-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans border-b border-zinc-100 pb-4">Projects</h2>
            <div className="space-y-16">
              {data.projects.map((proj, i) => (
                <div key={i} className={`grid grid-cols-1 gap-8 ${proj.image ? 'md:grid-cols-2' : ''}`}>
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium text-zinc-800 flex items-center gap-2">
                      {proj.name}
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" aria-label={`Visit project ${proj.name}`} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">{proj.description}</p>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {proj.techStack.map((tech, j) => (
                          <span key={j} className="text-xs font-sans px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {proj.image && (
                    <div className="rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 flex items-center justify-center">
                      <img src={proj.image} alt={proj.name} className="w-full h-auto object-cover max-h-64" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills & Contact */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-20">
          {data.skills && data.skills.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">Skills</h2>
              <ul className="font-sans text-zinc-600 space-y-2">
                {data.skills.map((skill, i) => (
                  <li key={i}>— {skill}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-6">
             <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">Contact</h2>
             <div className="space-y-4 font-sans">
               <p className="text-zinc-600">Interested in working together?</p>
               {user?.email && (
                 <a href={`mailto:${user.email}`} className="inline-block pb-1 border-b-2 border-zinc-900 text-zinc-900 font-medium hover:text-zinc-600 hover:border-zinc-600 transition-colors">
                   {user.email}
                 </a>
               )}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
