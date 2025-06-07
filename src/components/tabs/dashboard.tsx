"use client"

import { useState } from "react"
import { 
  Play, 
  Clock, 
  Download,
  Server,
  Grid2X2,
  List,
  LayoutGrid
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import DashboardProps from "@/interfaces/DashboardProps"
import ClientCardProps from "@/interfaces/ClientCardProps"
import { Input } from "@/components/ui/input"

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="bg-black/20 rounded-xl border border-white/[0.08] p-4">
      <div className="flex items-center gap-3">
        <div className="p-2">
          <Icon size={20} className="text-white/50" />
        </div>
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="text-xl font-medium text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function formatPlayTime(seconds: number): string {
  if (!seconds) return "Never played";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatLastPlayed(timestamp: number): string {
  if (!timestamp) return "Never";
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  }
}

function ClientCard({ version, onLaunch }: ClientCardProps) {
  return (
    <div className="bg-black/20 rounded-xl border border-white/[0.08] p-6 flex flex-col h-full">
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">{version.name}</h3>
            <p className="text-sm text-white/50 mt-1">{version.id}</p>
          </div>
          {version.stats?.is_running && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500 font-medium">
              Running
            </span>
          )}
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Play Time</span>
            <span className="text-white font-medium">
              {version.stats ? formatPlayTime(version.stats.total_play_time) : "Never played"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Last Played</span>
            <span className="text-white font-medium">
              {version.stats ? formatLastPlayed(version.stats.last_played) : "Never"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-white/[0.08]">
        <Button
          onClick={() => onLaunch(version.id)}
          className={`w-full h-10 rounded-lg transition-all duration-200 ${
            version.stats?.is_running
              ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
              : "bg-white/[0.08] hover:bg-white/[0.12] text-white"
          }`}
          disabled={version.stats?.is_running}
        >
          <Play size={16} className="mr-2" />
          {version.stats?.is_running ? "Running" : "Launch Client"}
        </Button>

        <Button
          variant="outline"
          className="w-full bg-transparent hover:bg-white/[0.08] text-white rounded-lg h-10 border-white/[0.08] hover:border-white/[0.12] transition-all duration-200"
        >
          <Server size={16} className="mr-2" />
          Start Server
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard({ versions, onGetMoreClients, onLaunch, username }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading] = useState(false)

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  })()

  const filteredVersions = versions.filter((version) => 
    version.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPlayTime = versions.reduce((total, version) => {
    return total + (version.stats?.total_play_time || 0)
  }, 0)

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#0A0A0A]">
      <div className="px-6 pt-6 pb-4 flex-shrink-0 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {greeting}, {username}
            </h2>
            <p className="text-white/50 mt-1">Ready to play some games?</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="bg-white/[0.08] border-white/[0.08] text-white hover:bg-white/[0.12] hover:border-white/[0.12] rounded-lg"
              onClick={onGetMoreClients}
            >
              <Download size={16} className="mr-2" />
              Install New Client
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/[0.08] border-white/[0.08] text-white hover:bg-white/[0.12] hover:border-white/[0.12] rounded-lg"
              onClick={() => window.location.hash = '#discovery'}
            >
              <Server size={16} className="mr-2" />
              Server Browser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatCard 
            title="Total Clients" 
            value={versions.length.toString()} 
            icon={LayoutGrid} 
          />
          <StatCard 
            title="Total Play Time" 
            value={formatPlayTime(totalPlayTime)} 
            icon={Clock} 
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.08] border-white/[0.08] text-white placeholder-white/50"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-lg ${viewMode === 'grid' ? 'bg-white/[0.08]' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid2X2 size={16} className="text-white/50" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-lg ${viewMode === 'list' ? 'bg-white/[0.08]' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} className="text-white/50" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-6 pb-6 min-h-0">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] rounded-xl" />
            ))}
          </div>
        ) : filteredVersions.length > 0 ? (
          <div className={`grid gap-3 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {filteredVersions.map((version) => (
              <ClientCard key={version.id} version={version} onLaunch={onLaunch} />
            ))}
          </div>
        ) : (
          <div className="h-[calc(100%-1rem)] flex flex-col items-center justify-center text-center">
            {searchQuery ? (
              <>
                <p className="text-lg text-white/90 mb-2">No clients match your search</p>
                <p className="text-white/50">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <p className="text-lg text-white/90 mb-2">No clients installed</p>
                <p className="text-white/50 mb-6">Get started by installing your first client</p>
                <Button
                  size="lg"
                  className="bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg"
                  onClick={onGetMoreClients}
                >
                  <Download size={16} className="mr-2" />
                  Install Client
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
