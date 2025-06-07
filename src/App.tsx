"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { 
  ArrowRight, 
  Settings, 
  Shield, 
  Loader2,
  Server
} from "lucide-react"

import BackgroundPaths from "./components/tabs/background-paths"
import SetupScreen from "./components/tabs/setup-screen"
import Dashboard from "./components/tabs/dashboard"
import MenuBar from "./components/tabs/menu-bar"
import DiscoveryScreen from "./components/tabs/discovery-screen"

import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

import { VersionData, VersionStats } from "./interfaces/VersionData"
import { ServerInfo } from "./interfaces/ServerInfo"
import { Button } from "./components/ui/button"

function WelcomeScreen({ onStartSetup }: { onStartSetup: () => void }) {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col items-center justify-center bg-[#0A0A0A]">
      <div className="text-center space-y-4 max-w-md">
        <div className="space-y-2">
          <h2 className="text-5xl font-bold text-white">
            fluster
          </h2>
          <div className="h-1 w-12 bg-white/20 mx-auto rounded-full"></div>
          <p className="text-xl text-white/60">we put games on your not so phone</p>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="mt-8 bg-white/[0.08] border-white/[0.08] text-white hover:bg-white/[0.12] hover:border-white/[0.12] rounded-full px-8"
          onClick={onStartSetup}
        >
          <ArrowRight size={16} className="mr-2" />
          Get Started
        </Button>
      </div>
    </div>
  )
}

const dataService = {
  getAvailableVersions: async (): Promise<VersionData[]> => {
    const versions: VersionData[] = [
      {
        id: "version-997deaae24a8",
        name: "Roblox 2008E",
        size: await invoke<string>("get_version_size", { version: "version-997deaae24a8" }),
        installed: await dataService.versionInstalled("version-997deaae24a8"),
        installing: false,
        stats: undefined
      }
    ];

    for (const version of versions) {
      try {
        const statsJson = await invoke<string>("get_version_stats", { version: version.id });
        version.stats = JSON.parse(statsJson) as VersionStats;
      } catch (error) {
        console.error(`Failed to fetch stats for version ${version.id}:`, error);
      }
    }

    return versions;
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

  getVersionStats: async (version: string): Promise<VersionStats> => {
    const statsJson = await invoke<string>("get_version_stats", { version });
    return JSON.parse(statsJson) as VersionStats;
  },

  getVersionSize: async (version: string): Promise<string> => {
    return await invoke("get_version_size", { version });
  },
}

export default function App() {
  const [versions, setVersions] = useState<VersionData[]>([])
  const [username, setUsername] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [currentView, setCurrentView] = useState<"welcome" | "setup" | "dashboard" | "discovery">("welcome")
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

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'discovery') {
        setCurrentView('discovery');
      } else if (hash === 'dashboard') {
        setCurrentView('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [])

  const handleInstall = async (id: string) => {
    setIsInstalling(true);

    try {
        const installResult = await dataService.installVersion(id);
        const isInstalled = await dataService.versionInstalled(id);
        
        if (isInstalled) {
            const freshVersions = await dataService.getAvailableVersions();
            setVersions(freshVersions);
        } else {
            throw new Error("Installation completed but client was not found");
        }

        setIsInstalling(false);
    } catch (error) {
        setIsInstalling(false);
        toast(`Something went wrong while installing ${id}`, {
            description: `${error}`,
            duration: 3000,
            action: {
                label: "Retry",
                onClick: () => handleInstall(id),
            },
        });

        console.error(`Failed to install version ${id}:`, error);
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

  const handleJoinServer = async (server: ServerInfo, version: string) => {
    try {
      await invoke("launch_server_connection", {
        version,
        serverId: server.id,
        serverIp: server.host,
        serverPort: server.port,
        userId: 1
      });
    } catch (error) {
      toast("Failed to join server", {
        description: `${error}`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleJoinServer(server, version),
        },
      });
      console.error("Failed to join server:", error);
    }
  };

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
    )
  }

  return (
    <div className="relative h-[450px] w-[800px] flex items-center justify-center overflow-hidden bg-black shadow-2xl">
      <BackgroundPaths />
      <MenuBar onMinimize={handleMinimize} onClose={handleClose} />
      <div className="relative z-10 w-full h-full">
        {currentView === "welcome" && (
          <WelcomeScreen onStartSetup={handleStartSetup} />
        )}
        {currentView === "setup" && (
          <SetupScreen
            availableVersions={availableVersions}
            installingVersions={installingVersions}
            installedVersions={installedVersions}
            isInstalling={isInstalling}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onGoToDashboard={handleGoToDashboard}
          />
        )}
        {currentView === "dashboard" && (
          <Dashboard
            versions={versions}
            onGetMoreClients={handleGetMoreClients}
            onLaunch={handleLaunch}
            username={username}
          />
        )}
        {currentView === "discovery" && (
          <DiscoveryScreen
            versions={versions}
            onBack={() => {
              window.location.hash = '';
              setCurrentView('dashboard');
            }}
            onJoinServer={handleJoinServer}
          />
        )}
      </div>
    </div>
  )
}
