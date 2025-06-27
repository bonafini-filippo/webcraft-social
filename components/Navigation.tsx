'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { 
  Home, 
  User, 
  MessageCircle, 
  Bell, 
  Settings, 
  LogOut,
  Shield,
  Search,
  X
} from 'lucide-react'
import { Button } from './ui/Button'
import { ThemeToggle } from './ui/ThemeToggle'
import { Input } from './ui/Input'

interface SearchResult {
  id: string
  username: string
  name?: string
  avatar?: string
}

const Navigation = () => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: session?.user?.username ? `/profile/${session.user.username}` : '/profile', label: 'Profile', icon: User },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ]

  if (session?.user?.isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: Shield })
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  // Gestione della ricerca utenti
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const users = await response.json()
        setSearchResults(users)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
    setIsSearching(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }

  const handleUserSelect = (username: string) => {
    router.push(`/profile/${username}`)
    setSearchQuery('')
    setShowResults(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  // Chiudi i risultati quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">BlogSocial</h1>
        <ThemeToggle />
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative" ref={searchRef}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-muted-foreground text-sm">
                Cercando...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.username)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                        {user.name?.[0] || user.username?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.name || user.username}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <div className="p-3 text-center text-muted-foreground text-sm">
                Nessun utente trovato
              </div>
            ) : null}
          </div>
        )}
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-secondary text-primary font-medium' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {session ? (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
              {session.user.name?.[0] || session.user.username?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session.user.name || session.user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{session.user.username}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Link href="/auth/signin">
            <Button className="w-full">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full">Sign Up</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default Navigation 