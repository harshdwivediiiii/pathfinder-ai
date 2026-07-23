export default function MinimalTemplate({ resume }) {
  return (
    <div className="w-[8.5in] min-h-[11in] mx-auto bg-white p-10 text-black" style={{ fontFamily: "Times New Roman, serif" }}>
      <h1 className="text-2xl font-bold mb-1">{resume.personalInfo?.name}</h1>
      <p className="text-sm mb-6">
        {[resume.personalInfo?.email, resume.personalInfo?.phone, resume.personalInfo?.location, resume.personalInfo?.linkedin]
          .filter(Boolean)
          .join(" | ")}
      </p>

      {resume.summary && (
        <div className="mb-5">
          <h2 className="text-base font-bold mb-1">Summary</h2>
          <p className="text-sm leading-relaxed">{resume.summary}</p>
        </div>
      )}

      {resume.skills && resume.skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold mb-1">Skills</h2>
          <p className="text-sm">{resume.skills.join(", ")}</p>
        </div>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold mb-1">Experience</h2>
          {resume.experience.map((exp, idx) => (
            <div key={idx} className="mb-3">
              <p className="text-sm font-bold">{exp.title}, {exp.company} — {exp.startDate} to {exp.endDate}</p>
              <ul className="list-disc list-outside ml-5 text-sm">
                {exp.achievements?.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {resume.education && resume.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold mb-1">Education</h2>
          {resume.education.map((edu, idx) => (
            <p key={idx} className="text-sm">{edu.degree}, {edu.school} — {edu.graduationDate}</p>
          ))}
        </div>
      )}
    </div>
  );
}