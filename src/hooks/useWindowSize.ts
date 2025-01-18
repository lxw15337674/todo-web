import { useState, useEffect } from 'react'

const isBrowser = typeof window !== 'undefined'

export function useWindowSize() {
  const [size, setSize] = useState({ 
    width: isBrowser ? window.innerWidth : 0, 
    height: isBrowser ? window.innerHeight : 0 
  })

  useEffect(() => {
    if (!isBrowser) return

    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', updateSize)
    updateSize()
    
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
} 