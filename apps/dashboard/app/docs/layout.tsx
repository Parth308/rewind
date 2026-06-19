import { DocsSidebar } from "../../components/docs/sidebar";
import { DocsBreadcrumbs } from "../../components/docs/breadcrumbs";
import { DocsTOC } from "../../components/docs/toc";
import React from "react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden w-full bg-[var(--background)] selection:bg-[var(--color-accent-green)] selection:text-black">
      <DocsSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative pt-14 lg:pt-0">
         {/* Background Gradients */}
         <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.15] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-black to-black" />

         <div id="docs-scroll-container" className="flex-1 overflow-auto relative z-10">
            <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
               
               {/* Documentation Content */}
               <main className="flex-1 min-w-0 max-w-3xl">
                  <div className="mb-8">
                    <DocsBreadcrumbs />
                  </div>
                  
                  <div className="max-w-none text-neutral-300
                                [&_h1]:text-4xl [&_h1]:mb-8 [&_h1]:font-sans [&_h1]:text-white [&_h1]:tracking-tight
                                [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:border-b [&_h2]:border-[var(--color-border-dark)] [&_h2]:pb-2 [&_h2]:font-sans [&_h2]:text-white [&_h2]:tracking-tight
                                [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:font-sans [&_h3]:text-white [&_h3]:tracking-tight
                                [&_p]:leading-relaxed [&_p]:mb-6
                                [&_a]:text-[var(--color-accent-green)] hover:[&_a]:underline
                                [&_code]:font-mono [&_code]:text-sm [&_code]:bg-white/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-neutral-200
                                [&_pre]:bg-[#050505] [&_pre]:border [&_pre]:border-[var(--color-border-dark)] [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-6 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-neutral-300
                                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_li]:mb-2 [&_li]:text-neutral-300
                                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
                                [&_strong]:text-white [&_strong]:font-semibold">
                    {children}
                  </div>
               </main>

               {/* Table of Contents sidebar */}
               <DocsTOC />
            </div>
         </div>
      </div>
    </div>
  );
}
