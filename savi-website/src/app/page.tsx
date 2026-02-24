import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { DownloadApp } from "@/components/sections/DownloadApp";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { BenefitStatement } from "@/components/sections/BenefitStatement";
import { ValueProp } from "@/components/sections/ValueProp";
import { TrustedStats } from "@/components/sections/TrustedStats";
import { FeatureDetails } from "@/components/sections/FeatureDetail";
import { DualAudience } from "@/components/sections/DualAudience";
import { Security } from "@/components/sections/Security";
import { CTABanner } from "@/components/sections/CTABanner";
import { AppVsPortal } from "@/components/sections/AppVsPortal";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <DownloadApp />
        <FeatureCards />
        <BenefitStatement />
        <ValueProp />
        <TrustedStats />
        <FeatureDetails />
        <DualAudience />
        <Security />
        <CTABanner />
        <AppVsPortal />
      </main>
      <Footer />
    </>
  );
}
