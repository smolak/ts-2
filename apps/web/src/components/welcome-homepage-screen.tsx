import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/button";
import { ArrowRight, Bookmark, Layers, Link2, Users } from "lucide-react";
import Link from "next/link";
import type React from "react";

export const WelcomeHomepageScreen = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-lead" />
            <span className="font-semibold text-lg tracking-tight">LinkDeck</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-muted-foreground text-sm transition-colors hover:text-foreground">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              How it works
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-16">
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-24">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lead/5 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
              <Layers className="h-10 w-10 text-lead" />
            </div>

            <h1 className="mb-6 text-balance font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-lead">Link</span>Deck
            </h1>

            <p className="mb-12 max-w-xl text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl">
              Discover, organize, and share links socially.
              <br />
              Follow curated decks and build your personal link library.
            </p>

            {/* Auth Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <SignUpButton>
                <Button size="lg" className="min-w-[160px] gap-2">
                  Sign up
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignUpButton>
              <SignInButton>
                <Button size="lg" variant="outline" className="min-w-[160px] bg-transparent">
                  Sign in
                </Button>
              </SignInButton>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-border border-t px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center font-bold text-3xl tracking-tight sm:text-4xl">Everything you need</h2>
            <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
              Build your perfect link collection with powerful tools designed for discovery and organization.
            </p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Link2 className="h-6 w-6" />}
                title="Organize Links"
                description="Create decks to categorize your links. Keep everything neatly organized and easy to find."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Social Discovery"
                description="Follow other curators and discover new content through the community."
              />
              <FeatureCard
                icon={<Bookmark className="h-6 w-6" />}
                title="Personal Library"
                description="Build your personal link library. Save, bookmark, and revisit your favorite content anytime."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-border border-t px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center font-bold text-3xl tracking-tight sm:text-4xl">How it works</h2>
            <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
              Get started in minutes and begin building your link collection.
            </p>

            <div className="grid gap-8 sm:grid-cols-3">
              <StepCard
                step="01"
                title="Create your account"
                description="Sign up for free and set up your profile in seconds."
              />
              <StepCard
                step="02"
                title="Build your decks"
                description="Create themed collections and start saving links."
              />
              <StepCard
                step="03"
                title="Share & discover"
                description="Follow others and share your curated decks with the community."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-border border-t px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">Ready to get started?</h2>
            <p className="mb-8 text-muted-foreground">
              Join thousands of users who are already organizing and sharing their favorite links.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <SignUpButton>
                <Button size="lg" className="gap-2">
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignUpButton>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-border border-t px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-lead" />
            <span className="font-semibold">LinkDeck</span>
          </div>
          <p className="text-muted-foreground text-sm">{new Date().getFullYear()} LinkDeck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-lead/50">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-lead/10 text-lead">{icon}</div>
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
        <span className="font-bold text-accent text-lg">{step}</span>
      </div>
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
