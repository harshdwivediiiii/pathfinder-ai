import { Mail, Phone, MapPin, Linkedin } from "lucide-react";

export default function ModernTemplate({ resume }) {
  return (
    <div className="w-[8.5in] min-h-[11in] mx-auto bg-white flex" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <div className="w-[2.8in] bg-slate-900 text-white p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold leading-tight">{resume.personalInfo?.name}</h1>
        </div>

        <div className="space-y-2 text-xs">
          {resume.personalInfo?.email && (
            <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0" /><span className="break-all">{resume.personalInfo.email}</span></div>
          )}
          {resume.personalInfo?.phone && (
            <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" /><span>{resume.personalInfo.phone}</span></div>
          )}
          {resume.personalInfo?.location && (
            <div className="flex items-center gap-2"><MapPin className="h-3 w-3 shrink-0" /><span>{resume.personalInfo.location}</span></div>
          )}
          {resume.personalInfo?.linkedin && (
            <div className="flex items-center gap-2"><Linkedin className="h-3 w-3 shrink-0" /><span className="break-all">{resume.personalInfo.linkedin}</span></div>
          )}
        </div>

        {resume.skills && resume.skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((skill, idx) => (
                <span key={idx} className="text-[10px] bg-white/10 px-2 py-1 rounded">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {resume.education && resume.education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Education</h2>
            <div className="space-y-3">
              {resume.education.map((edu, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-semibold">{edu.degree}</p>
                  <p className="text-slate-300">{edu.school}</p>
                  <p className="text-slate-400">{edu.graduationDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 space-y-6">
        {resume.summary && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b-2 border-slate-200 mb-2 pb-1">Summary</h2>
            <p className="text-sm leading-relaxed text-slate-800">{resume.summary}</p>
          </div>
        )}

        {resume.experience && resume.experience.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b-2 border-slate-200 mb-3 pb-1">Experience</h2>
            <div className="space-y-4">
              {resume.experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-sm text-slate-900">{exp.title}</h3>
                    <span className="text-xs font-medium text-slate-500">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="text-xs italic text-slate-600 mb-2">{exp.company} · {exp.location}</p>
                  <ul className="list-disc list-outside ml-4 text-sm space-y-1 text-slate-800">
                    {exp.achievements?.map((achieve, aIdx) => (
                      <li key={aIdx} className="leading-snug">{achieve}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects && resume.projects.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b-2 border-slate-200 mb-3 pb-1">Projects</h2>
            <div className="space-y-3">
              {resume.projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{proj.name}</h3>
                    <span className="text-xs italic text-slate-500">| {proj.technologies?.join(", ")}</span>
                  </div>
                  <p className="text-sm leading-snug text-slate-800">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}