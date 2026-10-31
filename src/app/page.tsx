"use client";

import React, { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import ConstructionStory from "@/components/ConstructionStory";
import House3DViewer from "@/components/House3DViewer";
import ProjectsCatalog from "@/components/ProjectsCatalog";
import TechAndSpecs from "@/components/TechAndSpecs";
import HouseCalculator from "@/components/HouseCalculator";
import CrimeaMap from "@/components/CrimeaMap";
import TransparentWorkflow from "@/components/TransparentWorkflow";
import InstagramFeed from "@/components/InstagramFeed";
import ContactModal from "@/components/ContactModal";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialMessage, setModalInitialMessage] = useState("");
  const [showSiteHeader, setShowSiteHeader] = useState(false);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  const handleSequenceCompleteChange = useCallback((isComplete: boolean) => {
    setShowSiteHeader((current) => current === isComplete ? current : isComplete);
  }, []);

  const handleOpenConsultation = (customMessage?: string) => {
    setModalInitialMessage(customMessage || "");
    setIsModalOpen(true);
  };

  const handleSelectProjectForEstimate = (projectName: string) => {
    // Scroll to calculator or open modal with project name
    const calcEl = document.getElementById("calculator");
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: "smooth" });
    } else {
      handleOpenConsultation(`Интересует смета по проекту: ${projectName}`);
    }
  };

  return (
    <main className="light-concrete-site min-h-screen bg-[#e8e6e1] text-[#202428] selection:bg-[#8E9BA8] selection:text-white">
      {showSiteHeader && <Header onOpenConsultation={() => handleOpenConsultation()} />}

      <ConstructionStory
        onSequenceCompleteChange={handleSequenceCompleteChange}
        onOpenConsultation={() => handleOpenConsultation()}
      />

      {/* 3. Interactive WebGL 3D House Explorer (adidaschile20 style) */}
      <House3DViewer />

      {/* 4. Luxury Projects Catalog with Floor Plans & Specs */}
      <ProjectsCatalog 
        onSelectProjectForEstimate={handleSelectProjectForEstimate} 
      />

      {/* 5. Engineering Standards, 9-Point Seismic, Machinery Fleet */}
      <TechAndSpecs />

      {/* 6. Interactive Crimean Cost & Mortgage Calculator */}
      <HouseCalculator />

      {/* 7. Interactive Crimean Map with Real Built Projects */}
      <CrimeaMap />

      {/* 8. Transparent Construction Workflow (24/7 Webcams & Drone) */}
      <TransparentWorkflow />

      {/* 9. Live Instagram @roystroy.crimea Feed & Video Testimonials */}
      <InstagramFeed />

      {/* 10. Footer with Crimean Offices & Legal Info */}
      <Footer />

      {/* Interactive Consultation & Estimate Request Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMessage={modalInitialMessage}
      />
    </main>
  );
}
