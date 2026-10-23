import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import './landing.css';
import { SECTION_IDS } from './content';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { Nav } from './Nav';
import { PlatformSection } from './PlatformSection';
import { RiskSection } from './RiskSection';
import { RolesSection } from './RolesSection';
import { StatusSection } from './StatusSection';

export type LandingPageProps = {
  /** Sign-in / sign-up / user controls, rendered in the navigation. */
  authSlot?: ReactNode;
};

/** Tracks which section is under the middle of the viewport, for the active nav link. */
function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = ['top', ...ids]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id === 'top' ? null : entry.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export default function LandingPage({ authSlot }: LandingPageProps) {
  const activeId = useActiveSection(SECTION_IDS);

  return (
    <div className="bs-landing">
      <a className="bs-skip" href="#main">
        Skip to content
      </a>
      <Nav authSlot={authSlot} activeId={activeId} />
      <main id="main">
        <Hero />
        <PlatformSection />
        <RolesSection />
        <RiskSection />
        <StatusSection />
      </main>
      <Footer />
    </div>
  );
}
