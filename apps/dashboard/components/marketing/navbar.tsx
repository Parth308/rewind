import { Play } from "lucide-react";
import { GithubIcon } from "../ui/github-icon";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-[var(--color-border-dark)] bg-[var(--background)]/70 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-dark)]">
          <Play className="h-4 w-4 text-[var(--color-accent-green)]" />
        </div>
        <span className="font-serif text-xl font-bold tracking-tight text-white">Rewind</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
        <a href="#features" className="transition-colors hover:text-white">Features</a>
        <a href="#architecture" className="transition-colors hover:text-white">Architecture</a>
        <a href="/docs" className="transition-colors text-[var(--color-accent-green)] hover:text-white">Docs</a>
        <a href="https://github.com/Parth308/rewind" className="flex items-center gap-2 text-white transition-opacity hover:opacity-80">
          <GithubIcon className="h-4 w-4" />
          <span>GitHub</span>
        </a>
        <a href="/login" className="flex items-center justify-center rounded-lg bg-[var(--color-accent-green)] px-4 py-2 text-xs font-semibold text-black transition-transform hover:scale-105 active:scale-95">
          Live Demo
        </a>
      </div>
    </nav>
  );
};
