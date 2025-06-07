export interface VersionStats {
    total_play_time: number;
    last_played: number;
    is_running: boolean;
}

export interface VersionData {
    id: string
    name: string
    type?: string
    size: string

    installed: boolean
    installing: boolean
    
    stats?: VersionStats
}