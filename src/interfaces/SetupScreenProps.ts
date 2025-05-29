import VersionData from "./VersionData"

export default interface SetupScreenProps {
    availableVersions: VersionData[]
    installingVersions: VersionData[]
    installedVersions: VersionData[]
    isInstalling: boolean
    onInstall: (id: string) => void
    onUninstall: (id: string) => void
    onGoToDashboard: () => void
}