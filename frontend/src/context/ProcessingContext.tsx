import React, { createContext, useContext, useState, ReactNode } from "react";

interface ProcessingContextType {
  isProcessing: boolean;
  status: string;
  setProcessing: (active: boolean, statusText?: string) => void;
}

const ProcessingContext = createContext<ProcessingContextType>({
  isProcessing: false,
  status: "",
  setProcessing: () => {},
});

export const useProcessing = () => useContext(ProcessingContext);

export const ProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Gemma 4 is synthesizing grounded response...");

  const setProcessing = (active: boolean, statusText?: string) => {
    setIsProcessing(active);
    if (statusText) {
      setStatus(statusText);
    }
  };

  return (
    <ProcessingContext.Provider value={{ isProcessing, status, setProcessing }}>
      {children}
    </ProcessingContext.Provider>
  );
};

// Deprecated flame overlay stub: clean, zero layout shift or blocking elements
export const GlobalFlameBackground: React.FC<{ isProcessing?: boolean; status?: string }> = () => {
  return null;
};
