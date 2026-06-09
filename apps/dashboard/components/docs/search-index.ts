export const docsSearchIndex = [
  {
    title: "Overview",
    href: "/docs",
    description: "Introduction to Rewind, design philosophy, and tech stack.",
    keywords: ["philosophy", "why rewind", "use cases", "tech stack", "overview"],
    headings: [
      { name: "Design Philosophy & Architecture", href: "/docs#philosophy" },
      { name: "Why Choose Rewind?", href: "/docs#why-rewind" },
      { name: "Core Use Cases", href: "/docs#use-cases" },
      { name: "The Stack", href: "/docs#tech-stack" }
    ]
  },
  {
    title: "Installation & Setup",
    href: "/docs/installation",
    description: "Deployment guides, local development, and environment variables.",
    keywords: ["install", "deploy", "setup", "vps", "docker", "local", "environment variables"],
    headings: [
      { name: "Exhaustive Environment Configuration", href: "/docs/installation#environment-variables" },
      { name: "Production VPS Deployment", href: "/docs/installation#production-deployment" },
      { name: "Local Development Environment", href: "/docs/installation#local-development" },
      { name: "User Identification (Recommended)", href: "/docs/installation#user-identification" }
    ]
  },
  {
    title: "AI Setup",
    href: "/docs/ai-setup",
    description: "Configure Google Gemini or OpenAI for AI-powered session summaries.",
    keywords: ["ai", "gemini", "openai", "setup", "summaries"],
    headings: []
  },
  {
    title: "Hardware & Scaling",
    href: "/docs/scaling",
    description: "Hardware requirements, memory breakdown, and VPS sizing recommendations.",
    keywords: ["hardware", "scaling", "vps", "memory", "sizing", "swap", "oom"],
    headings: [
      { name: "Single VPS Memory Breakdown", href: "/docs/scaling#memory-breakdown" },
      { name: "Recommended VPS Sizing", href: "/docs/scaling#vps-sizing" },
      { name: "Hobby / MVP (Up to 10k Sessions)", href: "/docs/scaling#hobby-mvp" },
      { name: "Startup / Standard (Up to 100k)", href: "/docs/scaling#startup-standard" },
      { name: "Enterprise (1M+ Sessions)", href: "/docs/scaling#enterprise" },
      { name: "Adding a Swap File", href: "/docs/scaling#creating-a-swap-file" }
    ]
  },
  {
    title: "Core Features",
    href: "/docs/features",
    description: "Tracker mechanics, session replay fidelity, and custom events.",
    keywords: ["features", "tracker", "replay", "custom events", "telemetry"],
    headings: [
      { name: "The Tracker Mechanism", href: "/docs/features#embedding-the-tracker" },
      { name: "High-Fidelity Session Replay", href: "/docs/features#session-replay" },
      { name: "Tracking Custom Events", href: "/docs/features#custom-events" },
      { name: "Live System Telemetry", href: "/docs/features#system-metrics" }
    ]
  },
  {
    title: "System Architecture",
    href: "/docs/architecture",
    description: "Ingestion pipeline data flow and microservices breakdown.",
    keywords: ["architecture", "pipeline", "ingestor", "worker", "api", "dashboard"],
    headings: [
      { name: "The Ingestion Pipeline", href: "/docs/architecture#data-flow" },
      { name: "Microservices Breakdown", href: "/docs/architecture#services" },
      { name: "Ingestor", href: "/docs/architecture#ingestor" },
      { name: "Worker", href: "/docs/architecture#worker" },
      { name: "API", href: "/docs/architecture#api" },
      { name: "Dashboard", href: "/docs/architecture#dashboard" }
    ]
  },
  {
    title: "User Profiles",
    href: "/docs/user-profiles",
    description: "Identifying users, CRM features, and AI support briefs.",
    keywords: ["users", "profiles", "identify", "crm", "support brief"],
    headings: [
      { name: "Identifying Users", href: "/docs/user-profiles#identifying-users" },
      { name: "The User Profile CRM", href: "/docs/user-profiles#the-user-profile" },
      { name: "AI Support Briefs", href: "/docs/user-profiles#ai-support-briefs" }
    ]
  },
  {
    title: "Data Privacy",
    href: "/docs/privacy",
    description: "GDPR compliance, input masking, blocking elements, and retention.",
    keywords: ["privacy", "gdpr", "masking", "blocking", "redaction", "retention"],
    headings: [
      { name: "Default Input Masking", href: "/docs/privacy#default-masking" },
      { name: "Blocking Specific Elements", href: "/docs/privacy#blocking-elements" },
      { name: "Masking All Text (Strict Mode)", href: "/docs/privacy#masking-text" },
      { name: "Network Payload Redaction", href: "/docs/privacy#network-redaction" },
      { name: "Data Retention & Auto-Deletion", href: "/docs/privacy#data-retention" }
    ]
  },
  {
    title: "API Reference",
    href: "/docs/api-reference",
    description: "REST API endpoints for authentication, projects, and sessions.",
    keywords: ["api", "endpoints", "rest", "authentication", "token"],
    headings: [
      { name: "Authentication", href: "/docs/api-reference#authentication" },
      { name: "Endpoints", href: "/docs/api-reference#endpoints" }
    ]
  },
  {
    title: "Troubleshooting",
    href: "/docs/troubleshooting",
    description: "Common issues, WebSocket disconnects, OOM crashes, and CORS errors.",
    keywords: ["troubleshooting", "errors", "websocket", "oom", "cors", "faq"],
    headings: [
      { name: "WebSockets Disconnecting Immediately", href: "/docs/troubleshooting#websocket-disconnects" },
      { name: "Database / Worker OOM Crashes", href: "/docs/troubleshooting#oom-crashes" },
      { name: "Dashboard CORS Errors", href: "/docs/troubleshooting#cors-errors" }
    ]
  }
];
