import DesignSection from "@/components/DesignSection";
import EngineeringSection from "@/components/EngineeringSection";
import Footer from "@/components/Footer";
import GallerySection from "@/components/GallerySection";
import MotionRoot from "@/components/MotionRoot";
import Navigation from "@/components/Navigation";
import PerformanceSection from "@/components/PerformanceSection";
import ScrollCarExperience from "@/components/ScrollCarExperience";
import TechnologySection from "@/components/TechnologySection";

export default function Home() {
  return (
    <MotionRoot>
      <a href="#performance" className="t-micro sr-only z-[80] bg-paper px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Navigation />
      <main>
        <ScrollCarExperience />
        <PerformanceSection />
        <DesignSection />
        <TechnologySection />
        <EngineeringSection />
        <GallerySection />
      </main>
      <Footer />
      <div aria-hidden className="grain" />
    </MotionRoot>
  );
}
