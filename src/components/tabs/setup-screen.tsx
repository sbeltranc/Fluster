"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Download, X, Check } from "lucide-react"

interface VersionData {
  id: string
  name: string
  size: string
  installed: boolean
  installing: boolean
  progress: number
  lastPlayed?: string
  playTime?: string
}

interface VersionItemProps {
  version: VersionData
  onClick: () => void
  isInstalled: boolean
  disabled?: boolean
}

function VersionItem({ version, onClick, isInstalled, disabled = false }: VersionItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 mb-2 rounded-lg bg-black backdrop-blur-sm border ${
        isInstalled ? "border-white/50 bg-white/5" : "border-white/30"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5 hover:border-white/50 cursor-pointer"}`}
      onClick={disabled || version.installing ? undefined : onClick}
    >
      <div className="flex flex-col flex-grow mr-2">
        <span className="font-medium text-xs text-white">{version.name}</span>
        <span className="text-[10px] text-neutral-400">{version.size}</span>
      </div>

      {isInstalled ? (
        <X size={14} className="text-red-500 hover:text-red-600" />
      ) : (
        <Download size={14} className="text-white/70 hover:text-white" />
      )}
    </div>
  )
}

function InstalledVersionItem({ version }: { version: VersionData }) {
  return (
    <div className="flex items-center justify-between p-2 mb-2 rounded-lg bg-black backdrop-blur-sm border border-white/50 bg-white/5">
      <div className="flex flex-col">
        <span className="font-medium text-xs text-white">{version.name}</span>
        <span className="text-[10px] text-neutral-400">{version.size}</span>
      </div>
      <Check size={14} className="text-green-500" />
    </div>
  )
}

interface SetupScreenProps {
  versions: VersionData[]
  availableVersions: VersionData[]
  installingVersions: VersionData[]
  installedVersions: VersionData[]
  isInstalling: boolean
  installationComplete: boolean
  onInstall: (id: string) => void
  onUninstall: (id: string) => void
  onGoToDashboard: () => void
}

export default function SetupScreen({
  versions,
  availableVersions,
  installingVersions,
  installedVersions,
  isInstalling,
  installationComplete,
  onInstall,
  onUninstall,
  onGoToDashboard,
}: SetupScreenProps) {
  return (
    <div className="pt-10 pb-4 px-6 max-h-[450px] overflow-auto flex flex-col items-center w-full h-full">
      <div className="w-full mx-auto max-w-[750px] flex flex-col items-center">
        <h2 className="text-lg font-bold text-center mb-1 text-white">
          {installationComplete ? "Installation Complete" : "Install Client versions"}
        </h2>
        <p className="text-center mb-3 text-xs text-neutral-400">
          {installationComplete
            ? "All selected versions have been installed successfully"
            : "You can add any others in the future"}
        </p>

        {!installationComplete ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <div className="w-full md:w-[300px]">
              <div className="p-2 bg-black backdrop-blur-md border border-white/30 rounded-lg h-[220px]">
                <h3 className="text-sm font-semibold mb-2 text-white">Available Versions</h3>
                <div className="space-y-1 h-[180px] overflow-auto pr-1">
                  {availableVersions.length > 0 ? (
                    availableVersions.map((version) => (
                      <VersionItem
                        key={version.id}
                        version={version}
                        onClick={() => onInstall(version.id)}
                        isInstalled={false}
                        disabled={isInstalling}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-[160px]">
                      <p className="text-center text-xs text-neutral-500">No versions available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Arrow with proper spacing */}
            <div className="flex-shrink-0 my-1 md:my-0">
              <div className="inline-flex items-center justify-center bg-black rounded-full p-1.5 shadow-md border border-white/20">
                <ArrowRight size={16} className="text-white md:rotate-0 rotate-90" />
              </div>
            </div>

            <div className="w-full md:w-[300px]">
              <div className="p-2 bg-black backdrop-blur-md border border-white/30 rounded-lg h-[220px]">
                <h3 className="text-sm font-semibold mb-2 text-white">
                  {isInstalling ? "Installing..." : "Installed Versions"}
                </h3>
                <div className="space-y-1 h-[180px] overflow-auto pr-1">
                  {/* Show installing versions first */}
                  {installingVersions.map((version) => (
                    <VersionItem key={version.id} version={version} onClick={() => {}} isInstalled={true} />
                  ))}

                  {/* Then show installed versions */}
                  {installedVersions.length > 0 && !isInstalling ? (
                    installedVersions.map((version) => (
                      <VersionItem
                        key={version.id}
                        version={version}
                        onClick={() => onUninstall(version.id)}
                        isInstalled={true}
                        disabled={isInstalling}
                      />
                    ))
                  ) : !isInstalling ? (
                    <div className="flex items-center justify-center h-[160px]">
                      <p className="text-center text-xs text-neutral-500">No versions installed</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="p-3 bg-black backdrop-blur-md border border-white/30 rounded-lg w-[300px] h-[220px]">
              <h3 className="text-sm font-semibold mb-2 text-white">Installed Versions</h3>
              <div className="space-y-1 h-[180px] overflow-auto pr-1">
                {installedVersions.map((version) => (
                  <InstalledVersionItem key={version.id} version={version} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center w-full">
          {!installationComplete ? (
            <Button
              variant="default"
              size="sm"
              disabled={isInstalling}
              className="rounded-md px-4 py-1 text-sm font-semibold 
                        bg-white hover:bg-neutral-200 
                        text-black transition-all duration-300 
                        hover:-translate-y-0.5 border-0
                        hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={onGoToDashboard}
              className="rounded-md px-4 py-1 text-sm font-semibold 
                        bg-white hover:bg-neutral-200
                        text-black transition-all duration-300 
                        hover:-translate-y-0.5 border-0
                        hover:shadow-md"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
