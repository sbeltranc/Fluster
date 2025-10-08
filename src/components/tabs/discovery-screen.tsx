"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Server, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ServerInfo } from "@/interfaces/ServerInfo";
import { VersionData } from "@/interfaces/VersionData";
import { showToast } from "@/utils/toast";

interface DiscoveryScreenProps {
  versions: VersionData[];
  onBack: () => void;
  onJoinServer: (server: ServerInfo, version: string) => void;
}

interface ServerCardProps {
  server: ServerInfo;
  onJoin: () => void;
}

function ServerCard({ server, onJoin }: ServerCardProps) {
  return (
    <div className="bg-black/20 rounded-xl border border-white/[0.08] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">{server.name}</h3>
            <p className="text-sm text-white/50 mt-1">{server.version}</p>
          </div>
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500 font-medium">
            Online
          </span>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Address</span>
            <span className="text-white font-medium">
              {server.host}:{server.port}
            </span>
          </div>
        </div>
      </div>
      <Button
        onClick={onJoin}
        className="w-full bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg"
      >
        <Play size={16} className="mr-2" />
        Join Server
      </Button>
    </div>
  );
}

export default function DiscoveryScreen({
  versions,
  onBack,
  onJoinServer,
}: DiscoveryScreenProps) {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const startDiscovery = async () => {
      setIsLoading(true);
      try {
        await invoke("start_listening");
        const unlistenFn = await listen<string>("discovery", (event) => {
          try {
            const serverInfo = JSON.parse(event.payload) as ServerInfo;
            setServers((prevServers) => {
              const serverMap = new Map(prevServers.map((s) => [s.id, s]));
              serverMap.set(serverInfo.id, serverInfo);
              return Array.from(serverMap.values());
            });
          } catch (error) {
            console.error("Failed to parse server info:", error);
          }
        });
        unlisten = unlistenFn;
      } catch (error) {
        console.error("Failed to start server discovery:", error);
        showToast("Error", {
          description: "Could not start server discovery.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    startDiscovery();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const filteredServers = servers.filter((server) => {
    const matchesSearch = server.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesVersion =
      !selectedVersion || server.version === selectedVersion;
    return matchesSearch && matchesVersion;
  });

  const installedVersions = versions.filter((v) => v.installed);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[250px] rounded-xl" />
          ))}
        </div>
      );
    }

    if (filteredServers.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {filteredServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onJoin={() => onJoinServer(server, server.version)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="h-[calc(100%-1rem)] flex flex-col items-center justify-center text-center">
        {searchQuery || selectedVersion ? (
          <>
            <p className="text-lg text-white/90 mb-2">
              No servers match your search
            </p>
            <p className="text-white/50">Try adjusting your filters</p>
          </>
        ) : (
          <>
            <p className="text-lg text-white/90 mb-2">No servers found</p>
            <p className="text-white/50">
              Waiting for servers to be discovered...
            </p>
            <Loader2 size={24} className="text-white/50 animate-spin mt-4" />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#0A0A0A]">
      <div className="px-6 pt-6 pb-4 flex-shrink-0 space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-white/[0.08]"
            onClick={onBack}
          >
            <ArrowLeft size={16} className="text-white/50" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">Server Browser</h2>
            <p className="text-white/50 mt-1">
              Find and join game servers on your local network
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl border border-white/[0.08] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2">
              <Server size={20} className="text-white/50" />
            </div>
            <div>
              <p className="text-sm text-white/50">Discovered Servers</p>
              <p className="text-xl font-medium text-white">{servers.length}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search servers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/[0.08] border-white/[0.08] text-white placeholder-white/50"
          />
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-white/[0.08] border-white/[0.08] text-white rounded-lg px-4 py-2 outline-none h-10"
          >
            <option value="">All Installed Versions</option>
            {installedVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-6 pb-6 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
