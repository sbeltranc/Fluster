"use client"

import { useState, useEffect } from "react"

interface MenuBarProps {
  onMinimize: () => void
  onClose: () => void
}

export default function MenuBar({ onMinimize, onClose }: MenuBarProps) {
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    const checkTauri = async () => {
      try {
        setIsTauri(true)
      } catch (e) {
        setIsTauri(false)
      }
    }

    checkTauri()
  }, [])

  if (!isTauri) return null

  return (
    <div
      data-tauri-drag-region
      className="absolute top-0 left-0 right-0 z-50 h-6 flex justify-end items-center"
    >
      <div className="flex pointer-events-auto">
        <button
          onClick={onMinimize}
          className="w-10 h-6 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          ―
        </button>

        <button
          onClick={onClose}
          className="w-10 h-6 flex items-center justify-center text-white/70 hover:bg-red-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
