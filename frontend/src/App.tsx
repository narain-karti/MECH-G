import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import { ProcessingProvider } from "./context/ProcessingContext";
import { TourProvider } from "./context/TourContext";
import { TourOverlay } from "./components/tour/TourOverlay";
import { Toaster } from "./components/ui/toast-stack";
import { GlobalCommandPalette } from "./components/navigation/GlobalCommandPalette";
import { LandingPage } from "./pages/LandingPage";
import { NotebookGalleryPage } from "./pages/NotebookGalleryPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { DiagnosticPage } from "./pages/DiagnosticPage";
import { GraphPage } from "./pages/GraphPage";
import { IngestPage } from "./pages/IngestPage";
import { SafetyCompliancePage } from "./pages/SafetyCompliancePage";

// Helper component to scroll to top on route change
const ScrollToTopOnNavigate: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <ProcessingProvider>
        <TourProvider>
          <TourOverlay />
          <GlobalCommandPalette />
          <Toaster position="bottom-right" />
          <ScrollToTopOnNavigate />
          <Routes>
            {/* 1. Marketing & Technical Showcase Editorial Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. Industrial Equipment Notebook Gallery */}
            <Route path="/notebooks" element={<NotebookGalleryPage />} />

            {/* 3. Unified Machine Workspace (Grounded Consultation, Schematics & Defect Register) */}
            <Route path="/notebook/:notebookId" element={<WorkspacePage />} />
            <Route path="/workspace" element={<Navigate to="/notebook/nb-vestas-v112" replace />} />

            {/* 4. Multimodal Field Diagnostics & Specialized Surfaces */}
            <Route path="/diagnostics" element={<DiagnosticPage />} />
            <Route path="/diagnose" element={<DiagnosticPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/safety" element={<SafetyCompliancePage />} />
            <Route path="/ingest" element={<IngestPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TourProvider>
      </ProcessingProvider>
    </BrowserRouter>
  );
}
