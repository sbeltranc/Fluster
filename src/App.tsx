"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import BackgroundPaths from "./components/tabs/background-paths";
import SetupScreen from "./components/tabs/setup-screen";
import Dashboard from "./components/tabs/dashboard";
import MenuBar from "./components/tabs/menu-bar";
import DiscoveryScreen from "./components/tabs/discovery-screen";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";

import { getCurrentWindow } from "@tauri-apps/api/window";

import { ServerInfo } from "./interfaces/ServerInfo";
import { useVersions } from "./hooks/useVersions";
import { useView } from "./hooks/useView";
import dataService from "./services/dataService";
import { showToast } from "./utils/toast";

export default function App() {
  const { currentView, navigateTo, handleStartSetup } = useView();
  const {
    versions,
    isLoading: isVersionsLoading,
    isInstalling,
    availableVersions,
    installingVersions,
    installedVersions,
    handleInstall,
    handleUninstall,
  } = useVersions();

  const [username, setUsername] = useState<string>("");
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsUserLoading(true);
      try {
        const userInfo = await dataService.getUserInfo();
        setUsername(userInfo.username);
      } catch (error) {
        console.error("Failed to load user data:", error);
        showToast("Error", { description: "Failed to load user data." });
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error("Failed to minimize window:", e);
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error("Failed to close window:", e);
    }
  };

  const handleLaunch = async (id: string) => {
    try {
      await dataService.launchVersion(id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showToast("An error occurred", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => handleLaunch(id),
        },
      });
      console.error(`Failed to launch version ${id}:`, error);
    }
  };

  const handleJoinServer = async (server: ServerInfo, version: string) => {
    try {
      // this could be dynamic, but for now, we'll assume userId is 1
      await dataService.launchServerConnection(server, version, 1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showToast("Failed to join server", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => handleJoinServer(server, version),
        },
      });
      console.error("Failed to join server:", error);
    }
  };

  const isLoading = isVersionsLoading || isUserLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="relative h-[450px] w-[800px] flex items-center justify-center overflow-hidden bg-black shadow-2xl">
          <BackgroundPaths />
          <MenuBar onMinimize={handleMinimize} onClose={handleClose} />
          <div className="relative z-10 flex items-center gap-3 text-white/90">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "welcome":
        return <WelcomeScreen onStartSetup={handleStartSetup} />;
      case "setup":
        return (
          <SetupScreen
            availableVersions={availableVersions}
            installingVersions={installingVersions}
            installedVersions={installedVersions}
            isInstalling={isInstalling}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onGoToDashboard={() => navigateTo("dashboard")}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            versions={versions}
            onGetMoreClients={() => navigateTo("setup")}
            onLaunch={handleLaunch}
            username={username}
          />
        );
      case "discovery":
        return (
          <DiscoveryScreen
            versions={versions}
            onBack={() => navigateTo("dashboard")}
            onJoinServer={handleJoinServer}
          />
        );
      default:
        return <WelcomeScreen onStartSetup={handleStartSetup} />;
    }
  };

  return (
    <div className="relative h-[450px] w-[800px] flex items-center justify-center overflow-hidden bg-black shadow-2xl">
      <BackgroundPaths />
      <MenuBar onMinimize={handleMinimize} onClose={handleClose} />
      <div className="relative z-10 w-full h-full">{renderCurrentView()}</div>
    </div>
  );
}
