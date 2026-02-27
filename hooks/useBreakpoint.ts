'use client'

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1200,
} as const

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile')

  useEffect(() => {
    const tabletMql = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`)
    const desktopMql = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`)

    function update() {
      if (desktopMql.matches) setBreakpoint('desktop')
      else if (tabletMql.matches) setBreakpoint('tablet')
      else setBreakpoint('mobile')
    }

    update()
    tabletMql.addEventListener('change', update)
    desktopMql.addEventListener('change', update)
    return () => {
      tabletMql.removeEventListener('change', update)
      desktopMql.removeEventListener('change', update)
    }
  }, [])

  return breakpoint
}
