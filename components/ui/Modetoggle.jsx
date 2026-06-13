"use client"

import React, { useEffect, useState, useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import gsap from "gsap"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isAnimating = useRef(false)
  const tweenRef = useRef(null)
  const overlayRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    setMounted(true)
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (tweenRef.current) {
        tweenRef.current.kill()
      }
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current)
      }
      isAnimating.current = false
    }
  }, [])

  if (!mounted) return null

  const currentTheme = theme === "system" ? resolvedTheme : theme
  const isDark = currentTheme === "dark"

  const toggleTheme = (e) => {
    if (isAnimating.current) return
    isAnimating.current = true

    const nextTheme = isDark ? "light" : "dark"
    const { clientX: x, clientY: y } = e

    const overlay = document.createElement("div")
    overlayRef.current = overlay
    
    // Use globals.css colors for background
    overlay.style.backgroundColor = isDark ? "oklch(1 0 0)" : "oklch(0.1 0.01 250)"
    overlay.style.position = "fixed"
    overlay.style.top = "0"
    overlay.style.left = "0"
    overlay.style.width = "2px"
    overlay.style.height = "2px"
    overlay.style.borderRadius = "50%"
    overlay.style.zIndex = "9999"
    overlay.style.pointerEvents = "none"
    overlay.style.left = `${x}px`
    overlay.style.top = `${y}px`
    overlay.style.transform = "translate(-50%, -50%) scale(0)"
    
    document.body.appendChild(overlay)

    const maxDistanceX = Math.max(x, window.innerWidth - x)
    const maxDistanceY = Math.max(y, window.innerHeight - y)
    const radius = Math.hypot(maxDistanceX, maxDistanceY)
    
    const scale = radius

    tweenRef.current = gsap.to(overlay, {
      scale: scale,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        if (isMountedRef.current) {
          setTheme(nextTheme)
        }
        
        tweenRef.current = gsap.to(overlay, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            if (overlay.parentNode) overlay.remove()
            isAnimating.current = false
            overlayRef.current = null
          }
        })
      }
    })
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}