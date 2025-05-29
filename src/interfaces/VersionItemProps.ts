import VersionData from "./VersionData"

export default interface VersionItemProps {
    version: VersionData
    onClick: () => void
    isInstalled: boolean
    disabled?: boolean
  }