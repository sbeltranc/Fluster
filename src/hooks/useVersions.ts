import { useState, useEffect, useCallback } from 'react';
import { VersionData } from '../interfaces/VersionData';
import dataService from '../services/dataService';
import { toast } from 'sonner';

export const useVersions = () => {
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hideInstalledInAvailable, setHideInstalledInAvailable] = useState(false);

  const refreshVersions = useCallback(async () => {
    try {
      const versionsData = await dataService.getAvailableVersions();
      setVersions(versionsData);
    } catch (error) {
      console.error("Failed to refresh versions:", error);
      toast.error("Failed to refresh versions.");
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    refreshVersions().finally(() => setIsLoading(false));
  }, [refreshVersions]);

  const handleInstall = useCallback(async (id: string) => {
    setIsInstalling(true);
    try {
      await dataService.installVersion(id);
      await refreshVersions();
    } catch (error) {
      toast(`Something went wrong while installing ${id}`, {
        description: `${error}`,
        duration: 3000,
        action: {
          label: "Retry",
          onClick: () => handleInstall(id),
        },
      });
      console.error(`Failed to install version ${id}:`, error);
    } finally {
      setIsInstalling(false);
    }
  }, [refreshVersions]);

  const handleUninstall = useCallback(async (id: string) => {
    try {
      await dataService.uninstallVersion(id);
      setVersions(prevVersions =>
        prevVersions.map(v => (v.id === id ? { ...v, installed: false } : v))
      );
    } catch (error) {
      toast(`Something went wrong while uninstalling ${id}`, {
        description: `${error}`,
        duration: 3000,
        action: {
          label: "Retry",
          onClick: () => handleUninstall(id),
        },
      });
      console.error(`Failed to uninstall version ${id}:`, error);
    }
  }, []);

  const availableVersions = versions.filter(v => !v.installed && !v.installing);
  const installingVersions = versions.filter(v => v.installing);
  const installedVersions = versions.filter(v => v.installed && !v.installing);

  return {
    versions,
    isLoading,
    isInstalling,
    hideInstalledInAvailable,
    setHideInstalledInAvailable,
    handleInstall,
    handleUninstall,
    availableVersions,
    installingVersions,
    installedVersions,
    refreshVersions,
  };
};
