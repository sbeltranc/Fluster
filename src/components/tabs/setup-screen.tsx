"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Download, X, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

import SetupScreenProps from "@/interfaces/SetupScreenProps"
import VersionItemProps from "@/interfaces/VersionItemProps"

function VersionItem({ version, onClick, isInstalled, disabled = false }: VersionItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl bg-black/20 border ${
        isInstalled ? "border-white/[0.08] bg-black/20" : "border-white/[0.08]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.08] hover:border-white/[0.12] cursor-pointer"}`}
      onClick={disabled || version.installing ? undefined : onClick}
    >
      <div className="flex flex-col flex-grow mr-2">
        <span className="text-base font-medium text-white">{version.name}</span>
        <span className="text-sm text-white/50">{version.size}</span>
      </div>

      {version.installing ? (
        <div className="h-8 w-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
          <Loader2 size={16} className="text-white/50 animate-spin" />
        </div>
      ) : isInstalled ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-white/[0.08] hover:bg-red-500/20 hover:text-red-500"
          onClick={onClick}
        >
          <X size={16} className="text-white/50 hover:text-red-500" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.12]"
          onClick={onClick}
        >
          <Download size={16} className="text-white/50" />
        </Button>
      )}
    </div>
  )
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
      <div className="px-8 pt-8 pb-6 flex-shrink-0 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Install Clients
            </h2>
            <p className="text-white/50 mt-1">Choose the versions you want to install</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/90">Available Versions</h3>
              {isInstalling && (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="text-white/50 animate-spin" />
                  <span className="text-sm text-white/50">Installing...</span>
                </div>
              )}
            </div>
            <div className="space-y-2 overflow-auto pr-2 h-[300px]">
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
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-lg text-white/90 mb-2">No versions available</p>
                  <p className="text-white/50">Check back later for new versions</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-white/90 mb-4">
              Installed Versions
            </h3>
            <div className="space-y-2 overflow-auto pr-2 h-[300px]">
              {installingVersions.map((version) => (
                <VersionItem 
                  key={version.id} 
                  version={version} 
                  onClick={() => {}} 
                  isInstalled={true} 
                />
              ))}

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
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-lg text-white/90 mb-2">No versions installed</p>
                  <p className="text-white/50">Select a version to install</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}