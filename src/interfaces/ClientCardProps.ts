import VersionData from "./VersionData";

export default interface ClientCardProps {
  version: VersionData
  onLaunch: (id: string) => void
}