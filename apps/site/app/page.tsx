import { SeigaihaDivider } from "../components/art/Seigaiha";
import { Benefits } from "../components/Benefits";
import { Faq } from "../components/Faq";
import { FinalCta } from "../components/FinalCta";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { Nav } from "../components/Nav";
import { Problem } from "../components/Problem";
import { ReportPreview } from "../components/ReportPreview";
import { StickyDemoBar } from "../components/StickyDemoBar";
import { TimezoneBand } from "../components/TimezoneBand";
import { Trust } from "../components/Trust";

export default function HomePage() {
  return (
    <>
      <Nav />

      <main className="bg-duskToDawn">
        <Hero />
        <Problem />
        <SeigaihaDivider id="divider-how" fill="var(--color-fuji)" className="opacity-70" />
        <HowItWorks />
        <Benefits />
        <ReportPreview />
        <TimezoneBand />
        <Trust />
        <SeigaihaDivider id="divider-faq" fill="var(--color-sakura)" className="opacity-70" />
        <Faq />
        <FinalCta />
      </main>

      <Footer />
      <StickyDemoBar />
    </>
  );
}
