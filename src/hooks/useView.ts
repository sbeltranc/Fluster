import { useState, useEffect, useCallback } from "react";
import dataService from "../services/dataService";
import { toast } from "sonner";

export type View = "welcome" | "setup" | "dashboard" | "discovery";

export const useView = () => {
  const [currentView, setCurrentView] = useState<View>("welcome");

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const isFlusterSetup = await dataService.isFlusterSetup();
        if (isFlusterSetup) {
          const hash = window.location.hash.slice(1);
          if (hash === "discovery" || hash === "dashboard") {
            setCurrentView(hash);
          } else {
            setCurrentView("dashboard");
          }
        }
      } catch (error) {
        console.error("Failed to check fluster setup status:", error);
      }
    };

    checkSetupStatus();

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "discovery" || hash === "dashboard") {
        setCurrentView(hash as View);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (view: View) => {
    if (view === "discovery" || view === "dashboard") {
      window.location.hash = view;
    } else {
      // if the view shouldn't have a hash, we clear it.
      window.location.hash = "";
    }
    setCurrentView(view);
  };

  const handleStartSetup = useCallback(async () => {
    try {
      await dataService.setupHostsFile();
      await dataService.flusterSetup();
      navigateTo("setup");
    } catch (error) {
      toast("Failed to setup", {
        description: `${error}`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleStartSetup(),
        },
      });
      console.error("Failed to setup Fluster dependencies:", error);
    }
  }, []);

  return {
    currentView,
    navigateTo,
    handleStartSetup,
  };
};
