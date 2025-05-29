export default interface VersionData {
    id: string
    name: string
    size: string

    installed: boolean
    installing: boolean
    
    lastPlayed?: string
    playTime?: string
}