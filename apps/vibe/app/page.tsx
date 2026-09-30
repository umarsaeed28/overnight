import { AgentSystem } from "../components/AgentSystem";
import { ArchSystem } from "../components/ArchSystem";
import { Faq } from "../components/Faq";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { OwnTests } from "../components/OwnTests";
import { Pricing } from "../components/Pricing";
import { ReportCard } from "../components/ReportCard";
import { Story } from "../components/Story";
import { Trust } from "../components/Trust";

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="nm-key absolute left-4 top-4 z-50 -translate-y-24 px-5 py-2 font-semibold focus:translate-y-0 [--r:1.2rem]"
      >
        Skip to content
      </a>
      <Hero />
      <main id="main" tabIndex={-1} className="outline-none">
        <Story />
        <AgentSystem />
        <ArchSystem />
        <ReportCard />
        <OwnTests />
        <Trust />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
