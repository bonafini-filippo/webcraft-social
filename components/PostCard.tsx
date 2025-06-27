'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Send, X, Trash2, Eye, EyeOff, Shield } from 'lucide-react'
import { formatRelativeTime } from '../lib/utils'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { SimpleMenu } from './ui/SimpleMenu'

interface User {
  id: string
  username: string
  name?: string
  avatar?: string
  isAdmin?: boolean
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    name?: string
    avatar?: string
    isAdmin?: boolean
  }
  _count?: {
    likes: number
    replies: number
  }
  likes: { id: string; userId: string }[]
}

interface Post {
  id: string
  content: string
  createdAt: Date
  author: User
  likes: { id: string; userId: string }[]
  comments: Comment[]
  reposts: { id: string; userId: string }[]
  isHidden?: boolean
  _count?: {
    likes: number
    comments: number
    reposts: number
  }
}

interface PostCardProps {
  post: Post
  currentUserId?: string
  onLike?: (postId: string) => void
  onCommentLike?: (commentId: string) => void
  onRepost?: (postId: string) => void
  onCommentsOpen?: (postId: string) => void
  onDelete?: (postId: string) => void
  onFollow?: (userId: string) => void
  onToggleVisibility?: (postId: string) => void
  isLiking?: boolean
  isReposting?: boolean
  isDeleting?: boolean
  isFollowing?: boolean
  isFollowLoading?: boolean
  isTogglingVisibility?: boolean
  likingComments?: Set<string>
  isActive?: boolean
  loadingComments?: boolean
}

const PostCard = ({ 
  post, 
  currentUserId,
  onLike,
  onCommentLike,
  onRepost,
  onCommentsOpen,
  onDelete,
  onFollow,
  onToggleVisibility,
  isLiking = false,
  isReposting = false,
  isDeleting = false,
  isFollowing = false,
  isFollowLoading = false,
  isTogglingVisibility = false,
  likingComments = new Set(),
  isActive = false,
  loadingComments = false
}: PostCardProps) => {
  // Calcola in tempo reale basandosi sui props (aggiornamento ottimistico)
  const isLiked = currentUserId ? post.likes.some(like => like.userId === currentUserId) : false
  const isReposted = currentUserId ? post.reposts.some(repost => repost.userId === currentUserId) : false
  const likesCount = post._count?.likes || post.likes.length
  const commentsCount = post._count?.comments || post.comments.length
  const repostsCount = post._count?.reposts || post.reposts.length

  // Non permettere di repostare i propri post
  const canRepost = currentUserId && post.author.id !== currentUserId

  const handleLike = () => {
    if (onLike && !isLiking) {
      // Chiama la funzione parent solo se non è già in elaborazione
      onLike(post.id)
    }
  }

  const handleCommentClick = () => {
    onCommentsOpen?.(post.id)
  }

  const handleCardClick = () => {
    onCommentsOpen?.(post.id)
  }

  return (
    <div 
      className={`bg-card border border-border rounded-lg hover:shadow-sm transition-all duration-200 mb-4 cursor-pointer ${
        isActive ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/10' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header: Avatar + Nome + @username + tempo + follow */}
        <div className="flex gap-3 items-center justify-between mb-3">
          <div className="flex gap-3 items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div 
                className="w-10 h-10 rounded-full overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/profile/${post.author.username}`
                }}
              >
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name || post.author.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {post.author.name?.[0] || post.author.username?.[0] || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* Nome + @username + tempo */}
            <div className="text-sm">
              {/* Prima riga: Nome */}
              <div className="flex items-center gap-2">
                <span 
                  className="font-bold text-foreground hover:underline cursor-pointer leading-tight flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/profile/${post.author.username}`
                  }}
                >
                  {post.author.name || post.author.username}
                  {post.author.isAdmin && (
                    <Shield size={14} className="text-blue-500 fill-current" />
                  )}
                </span>
              </div>

              {/* Seconda riga: Username e tempo */}
              <div className="flex items-center gap-1 text-muted-foreground text-xs leading-tight -mt-0.5">
                <span 
                  className="hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/profile/${post.author.username}`
                  }}
                >
                  @{post.author.username}
                </span>
                <span>·</span>
                <time 
                  className="hover:underline cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatRelativeTime(post.createdAt)}
                </time>
              </div>
            </div>
          </div>
          
          {/* Right: Follow button */}
          {currentUserId && 
           currentUserId !== post.author.id && 
           !isFollowing && 
           onFollow && (
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFollow(post.author.id)
                }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                +Follow
              </button>
            </div>
          )}
        </div>

        {/* Content: Contenuto del post allineato a sinistra */}
        <div className="text-foreground text-base leading-normal mb-4 whitespace-pre-wrap break-words hyphens-auto" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
          {post.content}
        </div>

        {/* Footer: Actions con menu alla fine */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCommentClick()
              }}
              disabled={loadingComments}
              className={`flex items-center gap-2 p-2 rounded-full transition-colors group ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-muted-foreground hover:text-blue-600'
              } ${loadingComments ? 'opacity-50' : ''}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm tabular-nums">{commentsCount}</span>
              {loadingComments && (
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                if (canRepost && !isReposting) {
                  onRepost?.(post.id)
                }
              }}
              disabled={!canRepost || isReposting}
              className={`flex items-center gap-2 p-2 rounded-full transition-colors group ${
                isReposted
                  ? 'text-green-600 hover:text-green-700'
                  : canRepost 
                    ? 'text-muted-foreground hover:text-green-600' 
                    : 'text-muted-foreground/50 cursor-not-allowed'
              } ${isReposting ? 'opacity-50' : ''}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Repeat2 size={18} />
              </div>
              <span className="text-sm tabular-nums">{repostsCount}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
              disabled={isLiking}
              className={`flex items-center gap-2 p-2 rounded-full transition-colors group ${
                isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-muted-foreground hover:text-red-600'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              </div>
              <span className="text-sm tabular-nums">{likesCount}</span>
            </button>
          </div>

          {/* Menu azioni solo se è il proprio post */}
          {currentUserId === post.author.id && (
            <div className="flex items-center gap-1">
              {/* Icona occhio barrato se il post è nascosto */}
              {post.isHidden && (
                <div className="flex items-center justify-center p-2 text-muted-foreground">
                  <EyeOff size={16} />
                </div>
              )}
              
              <SimpleMenu
                trigger={
                  <button className="flex items-center justify-center p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                }
                items={[
                  {
                    label: (
                      <div className="flex items-center gap-2">
                        {post.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        {isTogglingVisibility 
                          ? (post.isHidden ? 'Showing...' : 'Hiding...') 
                          : (post.isHidden ? 'Show post' : 'Hide post')
                        }
                      </div>
                    ),
                    onClick: () => {
                      if (onToggleVisibility && !isTogglingVisibility) {
                        onToggleVisibility(post.id)
                      }
                    }
                  },
                  {
                    label: (
                      <div className="flex items-center gap-2">
                        <Trash2 size={16} />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </div>
                    ),
                    onClick: () => {
                      if (onDelete && !isDeleting) {
                        onDelete(post.id)
                      }
                    },
                    variant: 'destructive'
                  }
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostCard 