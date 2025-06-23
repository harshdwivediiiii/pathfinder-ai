<h1>Pathmentor Ai 🧠💼</h1>

<p><strong>Your AI-Powered Career Coach & Resume Builder</strong></p>

<p>Pathmentor Ai is an intelligent web application that helps you craft professional resumes, write tailored cover letters, and prepare for interviews — all powered by AI. Whether you're launching your career or making your next big move, Pathmentor is your personalized guide.</p>

<hr />

<h2>🚀 Features</h2>

<ul>
  <li>📝 <strong>AI Resume Builder</strong> – Create personalized, ATS-friendly resumes.</li>
  <li>💌 <strong>Cover Letter Generator</strong> – Generate tone-matched, role-specific letters.</li>
  <li>🧠 <strong>Interview Preparation</strong> – Practice with adaptive, role-based AI questions.</li>
  <li>📊 <strong>Industry Insights</strong> – Get real-time trends, salary data, and in-demand skills.</li>
  <li>🔐 <strong>Secure Auth</strong> – Authenticated via Clerk with full user session management.</li>
</ul>

<hr />

<h2>🛠 Tech Stack</h2>

<ul>
  <li><strong>Framework:</strong> Next.js 14 (App Router)</li>
  <li><strong>Authentication:</strong> Clerk.dev</li>
  <li><strong>AI Engine:</strong> Gemini API (Google AI)</li>
  <li><strong>Database:</strong> PostgreSQL with Prisma ORM</li>
  <li><strong>Styling:</strong> TailwindCSS + ShadCN UI</li>
  <li><strong>Deployment:</strong> Vercel</li>
</ul>

<hr />

<h2>⚙️ Getting Started</h2>

<p>Clone the project and install dependencies:</p>

<pre><code>git clone https://github.com/yourusername/pathmentor-ai.git
cd pathmentor-ai
npm install
</code></pre>

<p>Create a <code>.env.local</code> file and add the following environment variables:</p>

<pre><code>DATABASE_URL=your_postgresql_connection_string

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=your_gemini_api_key
</code></pre>

<p>Generate the Prisma client:</p>

<pre><code>npx prisma generate
</code></pre>

<p>Then run the app:</p>

<pre><code>npm run dev
</code></pre>

<p>Visit <a href="http://localhost:3000">http://localhost:3000</a> to view your application.</p>

<hr />

<h2>🔐 Authentication</h2>

<p>All user accounts are managed securely using <a href="https://clerk.dev">Clerk.dev</a>. After signing in, users are routed through an onboarding flow before accessing dashboards.</p>

<hr />

<h2>🤖 AI Capabilities</h2>

<p>All smart content — resume bullets, cover letters, interview questions — are powered by the <a href="https://deepmind.google/technologies/gemini/">Gemini API</a>, using prompts customized by user input, tone, and job descriptions.</p>

<hr />

<h2>📄 License</h2>

<p>This project is licensed under the <a href="LICENSE">MIT License</a>.</p>

<hr />

<h2>✉️ Contact</h2>

<p>For questions, feedback, or collaborations:<br />
📧 <a href="mailto:harshvardhandwivedi18@gmail.com">harshvardhandwivedi18@gmail.com</a></p>

<hr />

<h2>🌐 Deployment</h2>

<p>Deploy instantly using <a href="https://vercel.com/new">Vercel</a>.<br />
Need help? See the <a href="https://nextjs.org/docs/app/building-your-application/deploying">Next.js Deployment Docs</a>.</p>

<hr />

<p><strong>Pathmentor Ai</strong> – <em>Smart Careers Start Here.</em></p>
