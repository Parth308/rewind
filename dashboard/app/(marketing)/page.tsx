import { Navbar } from "../../components/marketing/navbar";
import { Hero } from "../../components/marketing/hero";
import { TrustStats } from "../../components/marketing/trust-stats";
import { AsymmetricMatrix } from "../../components/marketing/asymmetric-matrix";
import { ReplayDemo } from "../../components/marketing/replay-demo";
import { Integrations } from "../../components/marketing/integrations";
import { FeaturesBento } from "../../components/marketing/features-bento";
import { ArchitectureFlow } from "../../components/marketing/architecture-flow";
import { DeploymentPipeline } from "../../components/marketing/deployment-pipeline";
import { FAQ } from "../../components/marketing/faq";
import { Footer } from "../../components/marketing/footer";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--color-accent-green)] selection:text-black font-sans">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-black to-black" />

      <Navbar />

      <main className="relative">
        <Hero />
        <TrustStats />
        <AsymmetricMatrix />
        
        {/* Replay demo moved ABOVE Features per user request */}
        <ReplayDemo />
        <Integrations />
        <FeaturesBento />
        
        <ArchitectureFlow />
        <DeploymentPipeline />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
