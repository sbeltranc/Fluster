"use client"

import { useState, useCallback, useEffect } from "react"

import { toast } from "sonner";

import BackgroundPaths from "./components/tabs/background-paths"
import SetupScreen from "./components/tabs/setup-screen"
import Dashboard from "./components/tabs/dashboard"
import MenuBar from "./components/tabs/menu-bar"

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import VersionData from "./interfaces/VersionData";

const dataService = {
  getAvailableVersions: async (): Promise<VersionData[]> => {
    return [
      {
        id: "version-997deaae24a8",
        name: "Roblox Client 2008",
        size: "placeholder",

        installed: await dataService.versionInstalled("version-997deaae24a8"),
        installing: false,

        lastPlayed: "placeholder",
        playTime: "placeholder",
      }
    ]
  },

  getUserInfo: async (): Promise<{ username: string }> => {
    return { username: await invoke("get_device_username") }
  },

  installVersion: async (version: string): Promise<boolean> => {
    return await invoke("install_client", { version });
  },

  uninstallVersion: async (version: string): Promise<string> => {
    return await invoke("uninstall_client", { version });
  },

  versionInstalled: async (version: string): Promise<boolean> => {
    return await invoke("is_version_installed", { version });
  },

  launchVersion: async (version: string): Promise<boolean> => {
    return await invoke("launch_client", { version });
  },
}

export default function App() {
  const [versions, setVersions] = useState<VersionData[]>([])
  const [username, setUsername] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [currentView, setCurrentView] = useState<"welcome" | "setup" | "dashboard">("welcome")
  const [hideInstalledInAvailable, setHideInstalledInAvailable] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      try {
        const [versionsData, userInfo] = await Promise.all([
          dataService.getAvailableVersions(),
          dataService.getUserInfo(),
        ])

        const isFlusterSetup = await invoke("is_fluster_setup");

        if (isFlusterSetup) {
          setCurrentView("dashboard")
        }

        setVersions(versionsData)
        setUsername(userInfo.username)
      } catch (error) {
        console.error("Failed to load initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleInstall = async (id: string) => {
    setIsInstalling(true)

    try {
      const success = await dataService.installVersion(id)

      if (success) {
        setIsInstalling(false)
        setVersions(versions.map((v) => (v.id === id ? { ...v, installed: true } : v)))
      }
    } catch (error) {
      setIsInstalling(false)
      toast(`Something went wrong while installing ${id}`, {
        description: `${error}`,
        duration: 3000,
        action: {
          label: "Retry",
          onClick: () => handleInstall(id),
        },
      })

      console.error(`Failed to install version ${id}:`, error)
    }
  }

  const handleUninstall = async (id: string) => {
    try {
      const success = await dataService.uninstallVersion(id)
      if (success) {
        setVersions(versions.map((v) => (v.id === id ? { ...v, installed: false } : v)))
      }
    } catch (error) {
      toast(`Something went wrong while uninstalling ${id}`, {
        description: `${error}`,
        duration: 3000,
        action: {
          label: "Retry",
          onClick: () => handleUninstall(id),
        },
      })

      console.error(`Failed to uninstall version ${id}:`, error)
    }
  }

  const handleGetMoreClients = () => {
    setHideInstalledInAvailable(true)
    setCurrentView("setup")
  }

  const handleStartSetup = async () => {
    try {
      await invoke("setup_hosts_file");
      await invoke("fluster_setup")
        
      setHideInstalledInAvailable(false)
      setCurrentView("setup")
    } catch (error) {
      toast("Failed to setup", {
        description: `${error}`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleStartSetup(),
        },
      })

      console.error("Failed to setup Fluster dependencies:", error)
    }
  }

  const handleGoToDashboard = () => {
    setCurrentView("dashboard")
  }

  const handleLaunch = async (id: string) => {
    try {
      await dataService.launchVersion(id);
    } catch (error) {
      toast("An error occurred", {
        description: `${error}`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleLaunch(id),
        },
      })

      console.error(`Failed to launch version ${id}:`, error)
    }
  }

  const handleMinimize = useCallback(async () => {
    try {
      await getCurrentWindow().minimize()
    } catch (e) {
      console.error("failed to minimize the window for whatever reason", e)
    }
  }, [])

  const handleClose = useCallback(async () => {
    try {
      await getCurrentWindow().close()
    } catch (e) {
      console.error("failed to close the window for whatever reason", e)
    }
  }, [])

  const availableVersions = versions.filter((v) => {
    if (hideInstalledInAvailable) {
      return !v.installed && !v.installing
    } else {
      return !v.installed && !v.installing
    }
  })

  const installingVersions = versions.filter((v) => v.installing)
  const installedVersions = versions.filter((v) => v.installed && !v.installing)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="relative h-[450px] w-[800px] flex items-center justify-center overflow-hidden bg-black shadow-2xl">
          <BackgroundPaths />
          <MenuBar onMinimize={handleMinimize} onClose={handleClose} />
          <div className="relative z-10 text-white">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative h-[450px] w-[800px] flex items-center justify-center overflow-hidden bg-black shadow-2xl">
        <BackgroundPaths />

        <MenuBar onMinimize={handleMinimize} onClose={handleClose} />

        {currentView === "welcome" && (
          <div className="relative z-10 w-full px-4 flex items-center justify-center h-full">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4 tracking-tighter text-white">Welcome to Fluster</h1>
              <button
                onClick={handleStartSetup}
                className="px-8 py-2 bg-black border border-white/30 rounded-full text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200"
              >
                Setup
              </button>
            </div>
          </div>
        )}

        {currentView === "setup" && (
          <div className="relative z-10 w-full h-full">
            <SetupScreen
              availableVersions={availableVersions}
              installingVersions={installingVersions}
              installedVersions={installedVersions}
              isInstalling={isInstalling}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
              onGoToDashboard={handleGoToDashboard}
            />
          </div>
        )}

        {currentView === "dashboard" && (
          <div className="relative z-10 w-full h-full">
            <Dashboard
              versions={installedVersions}
              onGetMoreClients={handleGetMoreClients}
              onLaunch={handleLaunch}
              username={username}
            />
          </div>
        )}
      </div>
    </div>
  )
}
