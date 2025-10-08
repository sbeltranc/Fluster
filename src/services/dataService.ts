import { invoke } from "@tauri-apps/api/core";

import { ServerInfo } from "../interfaces/ServerInfo";
import { VersionData, VersionStats } from "../interfaces/VersionData";

const dataService = {
  getAvailableVersions: async (): Promise<VersionData[]> => {
    const versions: VersionData[] = [
      {
        id: "version-997deaae24a8",
        name: "Roblox 2008E",
        size: await invoke<string>("get_version_size", {
          version: "version-997deaae24a8",
        }),
        installed: await dataService.versionInstalled("version-997deaae24a8"),
        installing: false,
        stats: undefined,
      },
    ];

    for (const version of versions) {
      try {
        const statsJson = await invoke<string>("get_version_stats", {
          version: version.id,
        });
        version.stats = JSON.parse(statsJson) as VersionStats;
      } catch (error) {
        console.error(
          `Failed to fetch stats for version ${version.id}:`,
          error,
        );
      }
    }

    return versions;
  },

  getUserInfo: async (): Promise<{ username: string }> => {
    return { username: await invoke("get_device_username") };
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

  isFlusterSetup: async (): Promise<boolean> => {
    return await invoke("is_fluster_setup");
  },

  setupHostsFile: async (): Promise<void> => {
    return await invoke("setup_hosts_file");
  },

  flusterSetup: async (): Promise<void> => {
    return await invoke("fluster_setup");
  },

  launchServerConnection: async (
    server: ServerInfo,
    version: string,
    userId: number,
  ): Promise<void> => {
    await invoke("launch_server_connection", {
      version,
      serverId: server.id,
      serverIp: server.host,
      serverPort: server.port,
      userId,
    });
  },
};

export default dataService;
