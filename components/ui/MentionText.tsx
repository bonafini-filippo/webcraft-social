'use client'

import { useRouter } from 'next/navigation'

interface MentionTextProps {
  text: string
  className?: string
}

const MentionText = ({ text, className = "" }: MentionTextProps) => {
  const router = useRouter()

  const handleMentionClick = (username: string) => {
    router.push(`/profile/${username}`)
  }

  const renderTextWithMentions = (text: string) => {
    // Regex per trovare i mention (@username)
    const mentionRegex = /@(\w+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Aggiungi il testo prima del mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      // Aggiungi il mention come link clickabile
      const username = match[1]
      parts.push(
        <button
          key={`mention-${match.index}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleMentionClick(username)
          }}
          className="text-blue-500 hover:text-blue-600 hover:underline font-medium transition-colors cursor-pointer"
        >
          @{username}
        </button>
      )

      lastIndex = match.index + match[0].length
    }

    // Aggiungi il testo rimanente
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  return (
    <span className={className}>
      {renderTextWithMentions(text)}
    </span>
  )
}

export default MentionText 