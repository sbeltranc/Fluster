"use client"

import { useState, useEffect } from "react"
import { Play, Settings, Clock, BarChart, Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import DashboardProps from "@/interfaces/DashboardProps";
import ClientCardProps from "@/interfaces/ClientCardProps";

function ClientCard({ version, onLaunch }: ClientCardProps) {
  return (
    <div className="bg-black backdrop-blur-sm rounded-lg border border-white/30 overflow-hidden hover:border-white/50 transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-medium text-white">{version.name}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10">
            <Settings size={16} className="text-neutral-400" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-neutral-400">
            <Clock size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">
              {version.lastPlayed ? `Last played: ${version.lastPlayed}` : "Never played"}
            </span>
          </div>
          <div className="flex items-center text-xs text-neutral-400">
            <BarChart size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate">{version.playTime ? `Play time: ${version.playTime}` : "No play time"}</span>
          </div>
        </div>

        <Button
          onClick={() => onLaunch(version.id)}
          variant="outline"
          className="w-full bg-white hover:bg-neutral-200 text-black rounded-md h-9 mt-auto border-0 transition-all duration-200"
        >
          <Play size={16} className="mr-2" />
          Launch
        </Button>

        <Button
          variant="outline"
          className="w-full bg-black hover:bg-white/10 border-bg text-white rounded-md h-9 mt-2 border-0 transition-all duration-200"
        >
          Start Server
        </Button>
      </div>
    </div>
  )
}

export default function Dashboard({ versions, onGetMoreClients, onLaunch, username }: DashboardProps) {
  const [greeting, setGreeting] = useState("Good day")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()

      switch (true) {
        case hour < 6:
          setGreeting("Good night")
          break
        case hour < 12:
          setGreeting("Good morning")
          break
        case hour < 18:
          setGreeting("Good afternoon")
          break
        default:
          setGreeting("Good evening")
      }
    }

    updateGreeting()

    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredVersions = versions.filter((version) => version.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <div className="px-8 pt-8 pb-4 flex-shrink-0">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {greeting}, {username}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="bg-black border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-md"
              onClick={onGetMoreClients}
            >
              <Download size={14} />
              Install Clients
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md bg-black border border-white/30 text-white text-sm focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-8 pb-6">
        {filteredVersions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {filteredVersions.map((version) => (
              <ClientCard key={version.id} version={version} onLaunch={onLaunch} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            {searchQuery ? (
              <>
                <p className="text-neutral-400 mb-2">No clients match your search</p>
                <p className="text-sm text-neutral-500">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-neutral-400 mb-2">No clients installed</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 bg-black border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  onClick={onGetMoreClients}
                >
                  <Download size={14} className="mr-2" />
                  Install a Client
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
