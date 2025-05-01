"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme()

  return (
    <Sonner
      theme={theme as "light" | "dark"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-neutral-400",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-black",
          cancelButton: "group-[.toast]:bg-neutral-800 group-[.toast]:text-white",
          error: "group-[.toaster]:!bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10",
          success: "group-[.toaster]:!bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10",
          warning: "group-[.toaster]:!bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10",
          info: "group-[.toaster]:!bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
