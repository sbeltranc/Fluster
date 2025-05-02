import VersionData from "./VersionData"

export default interface DashboardProps {
    versions: VersionData[]
    
    onGetMoreClients: () => void
    onLaunch: (id: string) => void
    
    username: string
}