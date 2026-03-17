"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { ProjectsContainer } from "@/features/projects/components/projects-container";

export default function Home() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-4xl px-8 py-12">
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          Projects
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discovered accounts from your email, categorized by relationship type.
        </p>

        <div className="mt-8">
          <ProjectsContainer />
        </div>
      </main>
    </AppLayout>
  );
}
