'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Shield } from 'lucide-react'

interface User {
  id: string
  username: string
  name?: string
  avatar?: string
  isAdmin?: boolean
}

interface MentionTextareaAdvancedProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  rows?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
}

const MentionTextareaAdvanced = ({
  value,
  onChange,
  placeholder = "What's happening?",
  className = "",
  maxLength,
  rows = 3,
  onKeyDown,
  disabled = false
}: MentionTextareaAdvancedProps) => {
  const [users, setUsers] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Debounce per la ricerca
  const searchUsers = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setUsers([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const users = await response.json()
          setUsers(users)
        }
      } catch (error) {
        console.error('Error searching users:', error)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  // Converte il testo con mention in HTML
  const textToHtml = (text: string) => {
    const mentionRegex = /@(\w+)/g
    return text.replace(mentionRegex, '<span style="color: #3b82f6; font-weight: 500;">@$1</span>')
  }

  // Converte HTML in testo normale (per textarea)
  const htmlToText = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // Aggiorna la visualizzazione evidenziata
  const updateEditor = () => {
    if (!highlightRef.current) return
    highlightRef.current.innerHTML = textToHtml(value)
  }

  // Detecta mention mentre l'utente scrive
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const lastWord = words[words.length - 1]

    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.substring(1)
      setMentionQuery(query)
      setMentionStart(cursorPosition - lastWord.length)
      setShowSuggestions(true)
      setSelectedIndex(0)
      
      if (query.length >= 2) {
        setIsLoading(true)
        searchUsers(query)
      } else {
        setIsLoading(false)
        setUsers([])
      }
    } else {
      setShowSuggestions(false)
      setUsers([])
      setIsLoading(false)
    }
  }, [value, searchUsers])

  // Gestisce il focus
  const handleFocus = () => {
    setIsFocused(true)
  }

  // Gestisce il blur
  const handleBlur = () => {
    setIsFocused(false)
  }

  // Inserisce il mention
  const insertMention = (user: User) => {
    if (!textareaRef.current || mentionStart === -1) return

    const beforeMention = value.substring(0, mentionStart)
    const afterMention = value.substring(textareaRef.current.selectionStart || mentionStart)
    const newText = `${beforeMention}@${user.username} ${afterMention}`
    
    onChange(newText)
    setShowSuggestions(false)
    setUsers([])
    
    // Focus sulla textarea e posiziona il cursore
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + user.username.length + 2
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Gestisce i tasti premuti
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % users.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(users[selectedIndex])
        return
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setUsers([])
      }
    }

    onKeyDown?.(e)
  }

  // Aggiorna l'evidenziazione quando cambia il valore
  useEffect(() => {
    updateEditor()
  }, [value])

  return (
    <div className="relative w-full min-w-0">
      {/* Highlighted text overlay */}
      <div 
        ref={highlightRef}
        className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-foreground ${className}`}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
      />
      
      {/* Placeholder quando non c'è testo */}
      {!value && !isFocused && (
        <div 
          className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words ${className} text-muted-foreground`}
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {placeholder}
        </div>
      )}
      
      {/* Transparent textarea on top */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder=""
        className={`${className} relative z-10 bg-transparent text-transparent caret-blue-500 resize-none w-full min-w-0`}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
      />

      {/* Suggestions dropdown - ottimizzato */}
      {showSuggestions && (isLoading || users.length > 0 || (mentionQuery.length > 0 && mentionQuery.length < 2)) && (
        <div className="absolute z-50 top-full left-0 -mt-1 w-80 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {mentionQuery.length > 0 && mentionQuery.length < 2 ? (
            <div className="p-3 text-center">
              <div className="text-muted-foreground text-sm">
                Type at least 2 characters to search users...
              </div>
            </div>
          ) : isLoading ? (
            <div className="p-3 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Searching users...</span>
              </div>
            </div>
          ) : users.length > 0 ? (
            users.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={`w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                  index === selectedIndex ? 'bg-muted' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                      {user.name?.[0] || user.username?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground truncate">
                      {user.name || user.username}
                    </span>
                    {user.isAdmin && (
                      <Shield size={12} className="text-blue-500 fill-current flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </div>
                </div>
              </button>
            ))
          ) : mentionQuery.length >= 2 ? (
            <div className="p-3 text-center">
              <div className="text-muted-foreground text-sm">
                No users found for "{mentionQuery}"
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Utility function per debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default MentionTextareaAdvanced 