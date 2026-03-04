'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  start: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skip: () => void;
  complete: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const start = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('tutorial-completed', 'true');
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('tutorial-completed', 'true');
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        start,
        nextStep,
        prevStep,
        skip,
        complete,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
