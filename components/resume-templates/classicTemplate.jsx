export default function ClassicTemplate({ resume }) {
  return (
    <div className="w-[8.5in] min-h-[11in] mx-auto bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-3xl font-serif font-bold uppercase tracking-wide mb-2">{resume.personalInfo?.name}</h1>
        <div className="text-sm space-x-2 flex flex-wrap justify-center items-center">
          <span>{resume.personalInfo?.email}</span>
          <span>•</span>
          <span>{resume.personalInfo?.phone}</span>
          <span>•</span>
          <span>{resume.personalInfo?.location}</span>
          {resume.personalInfo?.linkedin && (
            <>
              <span>•</span>
              <span>{resume.personalInfo.linkedin}</span>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2 pb-1">Professional Summary</h2>
          <p className="text-sm leading-relaxed">{resume.summary}</p>
        </div>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2 pb-1">Technical Skills</h2>
          <p className="text-sm leading-relaxed">{resume.skills.join(" • ")}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Professional Experience</h2>
          <div className="space-y-4">
            {resume.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-sm">{exp.title}</h3>
                  <span className="text-sm font-medium">{exp.startDate} - {exp.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm italic">{exp.company}</span>
                  <span className="text-sm italic">{exp.location}</span>
                </div>
                <ul className="list-disc list-outside ml-4 text-sm space-y-1">
                  {exp.achievements?.map((achieve, aIdx) => (
                    <li key={aIdx} className="leading-snug">{achieve}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Projects</h2>
          <div className="space-y-3">
            {resume.projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-bold text-sm">{proj.name}</h3>
                  <span className="text-xs italic text-gray-600">| {proj.technologies?.join(", ")}</span>
                </div>
                <p className="text-sm leading-snug">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Education</h2>
          <div className="space-y-2">
            {resume.education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-sm">{edu.degree}</h3>
                  <span className="text-sm">{edu.school}</span>
                </div>
                <span className="text-sm font-medium">{edu.graduationDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}