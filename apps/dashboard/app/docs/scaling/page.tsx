import { Metadata } from 'next';
import { CodeBlock } from '../../../components/docs/code-block';

export const metadata: Metadata = {
  title: 'Hardware & Scaling - Rewind Docs',
};

export default function ScalingPage() {
  return (
    <>
      <h1 id="hardware-requirements">Hardware & Scaling</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Rewind is designed to be extremely lightweight, but because it relies on a multi-container Docker architecture, there is a baseline memory footprint you must consider when selecting a VPS.
      </p>

      <h2 id="memory-breakdown">Single VPS Memory Breakdown</h2>
      <p>When you run <code>docker compose up</code> on a single VPS, Docker spins up 6 separate containers simultaneously. Here is the approximate baseline RAM consumption for each service while idling or under light load:</p>

      <ul className="space-y-3 my-6">
        <li><strong>PostgreSQL:</strong> ~256MB (Relational storage for sessions & user data)</li>
        <li><strong>Next.js (Dashboard):</strong> ~150MB (React Server Components & SSR)</li>
        <li><strong>Node.js (Worker):</strong> ~80MB (BullMQ consumer & Drizzle ORM batching)</li>
        <li><strong>Node.js (API):</strong> ~60MB (Dashboard REST API)</li>
        <li><strong>Node.js (Ingestor):</strong> ~50MB (Express/WebSocket server)</li>
        <li><strong>Redis:</strong> ~20MB (In-memory message broker for BullMQ)</li>
        <li><strong>OS & Docker Daemon:</strong> ~300MB</li>
      </ul>
      <p><strong>Total Baseline:</strong> ~916MB RAM</p>

      <h2 id="vps-sizing">Recommended VPS Sizing</h2>

      <h3 id="hobby-mvp">Hobby / MVP (Up to 10k Sessions/mo)</h3>
      <p><strong>Specs:</strong> 1 vCPU, 1GB RAM + 2GB Swap File<br/>
      <strong>Estimated Cost:</strong> $5 - $6 / mo (e.g., DigitalOcean Basic Droplet, Hetzner CPX11)</p>
      <p>Because the baseline footprint is ~900MB, running on a 1GB RAM instance <strong>requires a swap file</strong> to prevent the Linux OOM (Out of Memory) killer from terminating PostgreSQL during traffic spikes. This setup is perfect for small blogs or early-stage startups.</p>

      <h3 id="startup-standard">Startup / Standard (Up to 100k Sessions/mo)</h3>
      <p><strong>Specs:</strong> 2 vCPU, 4GB RAM<br/>
      <strong>Estimated Cost:</strong> $20 - $25 / mo</p>
      <p>This is the recommended baseline for production. With 4GB of RAM, PostgreSQL has plenty of headroom to cache active indices in memory, resulting in significantly faster dashboard queries. The extra CPU core allows the Worker container to process the Redis queue simultaneously while the Ingestor handles WebSocket traffic.</p>

      <h3 id="enterprise">Enterprise (1M+ Sessions/mo)</h3>
      <p><strong>Specs:</strong> 4+ vCPU, 8GB+ RAM (or split infrastructure)<br/>
      <strong>Estimated Cost:</strong> $50+ / mo</p>
      <p>At massive scale, you should decouple the infrastructure. Run PostgreSQL and Redis on managed database services. You can then horizontally scale the Ingestor and Worker containers across multiple cheap VPS nodes behind a load balancer, as they are entirely stateless.</p>

      <h2 id="creating-a-swap-file">Adding a Swap File (1GB VPS)</h2>
      <p>If you choose the 1GB RAM tier, you must configure a swap file before running docker compose, otherwise your containers will crash.</p>
      
      <CodeBlock language="bash" code={`# Create a 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab`} />
    </>
  );
}
