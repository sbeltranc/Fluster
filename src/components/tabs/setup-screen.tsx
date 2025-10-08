"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Download, X, Loader2 } from "lucide-react";
import { VersionData } from "@/interfaces/VersionData";

interface VersionItemProps {
  version: VersionData;
  onClick: () => void;
  actionType: "install" | "uninstall" | "installing";
  disabled?: boolean;
}

interface SetupScreenProps {
  availableVersions: VersionData[];
  installingVersions: VersionData[];
  installedVersions: VersionData[];
  isInstalling: boolean;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onGoToDashboard: () => void;
}

function VersionItem({
  version,
  onClick,
  actionType,
  disabled = false,
}: VersionItemProps) {
  const isClickable = !disabled && actionType !== "installing";

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/[0.08] ${
        isClickable
          ? "hover:bg-white/[0.08] hover:border-white/[0.12] cursor-pointer"
          : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex flex-col flex-grow mr-2">
        <span className="text-base font-medium text-white">{version.name}</span>
        <span className="text-sm text-white/50">{version.size}</span>
      </div>

      {actionType === "installing" ? (
        <div className="h-8 w-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
          <Loader2 size={16} className="text-white/50 animate-spin" />
        </div>
      ) : actionType === "uninstall" ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-white/[0.08] hover:bg-red-500/20 hover:text-red-500"
          onClick={onClick}
          disabled={disabled}
        >
          <X size={16} className="text-white/50 group-hover:text-red-500" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.12]"
          onClick={onClick}
          disabled={disabled}
        >
          <Download size={16} className="text-white/50" />
        </Button>
      )}
    </div>
  );
}

export default function SetupScreen({
  availableVersions,
  installingVersions,
  installedVersions,
  isInstalling,
  onInstall,
  onUninstall,
  onGoToDashboard,
}: SetupScreenProps) {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#0A0A0A]">
      <div className="px-8 pt-8 pb-6 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Install Clients</h2>
            <p className="text-white/50 mt-1">
              Choose the versions you want to install
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="bg-white/[0.08] border-white/[0.08] text-white hover:bg-white/[0.12] hover:border-white/[0.12] rounded-lg"
            onClick={onGoToDashboard}
          >
            <ArrowRight size={16} className="mr-2" />
            Continue to Dashboard
          </Button>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 px-8 pb-8 min-h-0">
        {/* Available Versions Column */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/90">
              Available Versions
            </h3>
            {isInstalling && (
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="text-white/50 animate-spin" />
                <span className="text-sm text-white/50">Installing...</span>
              </div>
            )}
          </div>
          <div className="space-y-2 overflow-auto pr-2 flex-grow">
            {availableVersions.length > 0 ? (
              availableVersions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  onClick={() => onInstall(version.id)}
                  actionType="install"
                  disabled={isInstalling}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg text-white/90 mb-2">
                  No new versions available
                </p>
                <p className="text-white/50">
                  You have installed all available clients.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Installed Versions Column */}
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-white/90 mb-4">
            Installed Versions
          </h3>
          <div className="space-y-2 overflow-auto pr-2 flex-grow">
            {installingVersions.length === 0 &&
            installedVersions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg text-white/90 mb-2">
                  No versions installed
                </p>
                <p className="text-white/50">Select a version to install</p>
              </div>
            ) : (
              <>
                {installingVersions.map((version) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    onClick={() => {}}
                    actionType="installing"
                    disabled
                  />
                ))}
                {installedVersions.map((version) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    onClick={() => onUninstall(version.id)}
                    actionType="uninstall"
                    disabled={isInstalling}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
