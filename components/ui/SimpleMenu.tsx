'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface SimpleMenuProps {
  trigger: React.ReactNode
  items: Array<{
    label: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
  align?: 'left' | 'right'
}

export const SimpleMenu = ({ trigger, items, align = 'right' }: SimpleMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Usiamo un timeout per evitare che si chiuda immediatamente
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const handleItemClick = (e: React.MouseEvent, onClick: () => void) => {
    e.stopPropagation()
    e.preventDefault()
    onClick()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <div 
        onClick={handleTriggerClick}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={cn(
            'absolute top-full mt-1 min-w-[140px] bg-card border border-border rounded-lg shadow-xl z-[1000] py-1 animate-in slide-in-from-top-2 duration-200',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => handleItemClick(e, item.onClick)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-all duration-200 cursor-pointer rounded-sm',
                item.variant === 'destructive' 
                  ? 'text-destructive hover:bg-destructive/10 hover:text-destructive' 
                  : 'text-foreground hover:bg-accent'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 