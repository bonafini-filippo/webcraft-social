'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { SimpleMenu } from '../components/ui/SimpleMenu'
import PostCard from '../components/PostCard'
import MentionTextareaAdvanced from '../components/ui/MentionTextareaAdvanced'
import MentionText from '../components/ui/MentionText'
import { formatRelativeTime } from '../lib/utils'
import { Heart, MessageCircle, X, Send, MoreHorizontal, Trash2, Shield } from 'lucide-react'

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
  createdAt: string
  isHidden: boolean
  author: {
    id: string
    username: string
    name?: string
    avatar?: string
    isAdmin?: boolean
  }
  likes: { id: string; userId: string }[]
  comments: Comment[]
  reposts: { id: string; userId: string }[]
  _count: {
    likes: number
    comments: number
    reposts: number
  }
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())
  const [repostingPosts, setRepostingPosts] = useState<Set<string>>(new Set())
  const [commentingPosts, setCommentingPosts] = useState<Set<string>>(new Set())
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())
  const [deletingPosts, setDeletingPosts] = useState<Set<string>>(new Set())
  const [togglingVisibility, setTogglingVisibility] = useState<Set<string>>(new Set())
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set())
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [followedUsersInitialized, setFollowedUsersInitialized] = useState(false)
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [sidebarCommentText, setSidebarCommentText] = useState('')

  // Trova il post attivo
  const activePost = activePostId ? posts.find(post => post.id === activePostId) : null

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
    setLoading(false)
  }

  const fetchFollowedUsers = async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch('/api/users/me/following')
      if (response.ok) {
        const { followingIds } = await response.json()
        setFollowedUsers(new Set(followingIds))
        setFollowedUsersInitialized(true)
      }
    } catch (error) {
      console.error('Error fetching followed users:', error)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Carica gli utenti seguiti quando la sessione è disponibile
  useEffect(() => {
    if (session?.user?.id && !followedUsersInitialized) {
      fetchFollowedUsers()
    }
  }, [session?.user?.id, followedUsersInitialized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !session) return

    setPosting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts(prev => [newPost, ...prev])
        setContent('')
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
    setPosting(false)
  }

  const handleLike = async (postId: string) => {
    if (!session) return

    // Previeni click multipli sullo stesso post
    if (likingPosts.has(postId)) {
      return
    }

    // Aggiungi il post alla lista di quelli in elaborazione
    setLikingPosts(prev => new Set(prev).add(postId))

    // Trova lo stato attuale del like PRIMA dell'aggiornamento
    const currentPost = posts.find(post => post.id === postId)
    if (!currentPost) {
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      return
    }

    const currentUserId = session.user.id
    const isCurrentlyLiked = currentPost.likes.some(like => like.userId === currentUserId)

    // Aggiornamento ottimistico - aggiorna immediatamente l'UI
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isCurrentlyLiked 
              ? post.likes.filter(like => like.userId !== currentUserId)
              : [...post.likes, { id: `temp-${Date.now()}`, userId: currentUserId }],
            _count: {
              ...post._count,
              likes: isCurrentlyLiked ? post._count.likes - 1 : post._count.likes + 1
            }
          }
        }
        return post
      })
    )

    // Richiesta in background
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Se fallisce, reverta l'aggiornamento ottimistico
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                              likes: isCurrentlyLiked 
                ? [...post.likes, { id: `temp-${Date.now()}`, userId: currentUserId }]
                : post.likes.filter(like => like.userId !== currentUserId),
                _count: {
                  ...post._count,
                  likes: isCurrentlyLiked ? post._count.likes + 1 : post._count.likes - 1
                }
              }
            }
            return post
          })
        )
      }
    } catch (error) {
      console.error('Error liking post:', error)
      // Se c'è un errore, reverta l'aggiornamento ottimistico
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes: isCurrentlyLiked 
                ? [...post.likes, { id: `temp-${Date.now()}`, userId: currentUserId }]
                : post.likes.filter(like => like.userId !== currentUserId),
              _count: {
                ...post._count,
                likes: isCurrentlyLiked ? post._count.likes + 1 : post._count.likes - 1
              }
            }
          }
          return post
        })
      )
    } finally {
      // Rimuovi il post dalla lista di quelli in elaborazione
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleRepost = async (postId: string) => {
    if (!session) return

    // Previeni click multipli sullo stesso post
    if (repostingPosts.has(postId)) {
      return
    }

    // Aggiungi il post alla lista di quelli in elaborazione
    setRepostingPosts(prev => new Set(prev).add(postId))

    // Trova lo stato attuale del repost PRIMA dell'aggiornamento
    const currentPost = posts.find(post => post.id === postId)
    if (!currentPost) {
      setRepostingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      return
    }

    // Non permettere di repostare i propri post
    if (currentPost.author.id === session.user.id) {
      setRepostingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      return
    }

    const currentUserId = session.user.id
    const isCurrentlyReposted = currentPost.reposts.some(repost => repost.userId === currentUserId)

    // Aggiornamento ottimistico
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            reposts: isCurrentlyReposted 
              ? post.reposts.filter(repost => repost.userId !== currentUserId)
              : [...post.reposts, { id: `temp-${Date.now()}`, userId: currentUserId }],
            _count: {
              ...post._count,
              reposts: isCurrentlyReposted ? post._count.reposts - 1 : post._count.reposts + 1
            }
          }
        }
        return post
      })
    )

    // Richiesta in background
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Se fallisce, reverta l'aggiornamento ottimistico
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                reposts: isCurrentlyReposted 
                  ? [...post.reposts, { id: `temp-${Date.now()}`, userId: currentUserId }]
                  : post.reposts.filter(repost => repost.userId !== currentUserId),
                _count: {
                  ...post._count,
                  reposts: isCurrentlyReposted ? post._count.reposts + 1 : post._count.reposts - 1
                }
              }
            }
            return post
          })
        )
      }
    } catch (error) {
      console.error('Error reposting post:', error)
      // Se c'è un errore, reverta l'aggiornamento ottimistico
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              reposts: isCurrentlyReposted 
                ? [...post.reposts, { id: `temp-${Date.now()}`, userId: currentUserId }]
                : post.reposts.filter(repost => repost.userId !== currentUserId),
              _count: {
                ...post._count,
                reposts: isCurrentlyReposted ? post._count.reposts + 1 : post._count.reposts - 1
              }
            }
          }
          return post
        })
      )
    } finally {
      // Rimuovi il post dalla lista di quelli in elaborazione
      setRepostingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!session) return

    // Previeni click multipli sullo stesso commento
    if (likingComments.has(commentId)) {
      return
    }

    // Aggiungi il commento alla lista di quelli in elaborazione
    setLikingComments(prev => new Set(prev).add(commentId))

    // Trova il commento e il suo stato di like attuale
    let currentComment: Comment | null = null
    let postIndex = -1
    let commentIndex = -1

    posts.forEach((post, pIndex) => {
      const cIndex = post.comments.findIndex(c => c.id === commentId)
      if (cIndex !== -1) {
        currentComment = post.comments[cIndex]
        postIndex = pIndex
        commentIndex = cIndex
      }
    })

    if (!currentComment || postIndex === -1) {
      setLikingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
      return
    }

    const currentUserId = session.user.id
    const isCurrentlyLiked = (currentComment as Comment).likes.some((like: { id: string; userId: string }) => like.userId === currentUserId)

    // Aggiornamento ottimistico
    setPosts(prevPosts => 
      prevPosts.map((post, pIndex) => {
        if (pIndex === postIndex) {
          return {
            ...post,
            comments: post.comments.map((comment, cIndex) => {
              if (cIndex === commentIndex) {
                return {
                  ...comment,
                  likes: isCurrentlyLiked 
                    ? comment.likes.filter(like => like.userId !== currentUserId)
                    : [...comment.likes, { id: `temp-${Date.now()}`, userId: currentUserId }],
                  _count: {
                    ...comment._count!,
                    likes: isCurrentlyLiked ? comment._count!.likes - 1 : comment._count!.likes + 1
                  }
                }
              }
              return comment
            })
          }
        }
        return post
      })
    )

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Se fallisce, reverta l'aggiornamento ottimistico
        setPosts(prevPosts => 
          prevPosts.map((post, pIndex) => {
            if (pIndex === postIndex) {
              return {
                ...post,
                comments: post.comments.map((comment, cIndex) => {
                  if (cIndex === commentIndex) {
                    return {
                      ...comment,
                      likes: isCurrentlyLiked 
                        ? [...comment.likes, { id: `temp-${Date.now()}`, userId: currentUserId }]
                        : comment.likes.filter(like => like.userId !== currentUserId),
                      _count: {
                        ...comment._count!,
                        likes: isCurrentlyLiked ? comment._count!.likes + 1 : comment._count!.likes - 1
                      }
                    }
                  }
                  return comment
                })
              }
            }
            return post
          })
        )
      }
    } catch (error) {
      console.error('Error liking comment:', error)
      // Rollback in caso di errore
      setPosts(prevPosts => 
        prevPosts.map((post, pIndex) => {
          if (pIndex === postIndex) {
            return {
              ...post,
              comments: post.comments.map((comment, cIndex) => {
                if (cIndex === commentIndex) {
                  return {
                    ...comment,
                    likes: isCurrentlyLiked 
                      ? [...comment.likes, { id: `temp-${Date.now()}`, userId: currentUserId }]
                      : comment.likes.filter(like => like.userId !== currentUserId),
                    _count: {
                      ...comment._count!,
                      likes: isCurrentlyLiked ? comment._count!.likes + 1 : comment._count!.likes - 1
                    }
                  }
                }
                return comment
              })
            }
          }
          return post
        })
      )
    } finally {
      // Rimuovi il commento dalla lista di quelli in elaborazione
      setLikingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!session || deletingPosts.has(postId)) return

    setDeletingPosts(prev => new Set(prev).add(postId))

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Rimuovi il post dalla lista
        setPosts(prev => prev.filter(post => post.id !== postId))
        
        // Se era il post attivo, chiudi la sidebar
        if (activePostId === postId) {
          setActivePostId(null)
          setSidebarCommentText('')
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setDeletingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleToggleVisibility = async (postId: string) => {
    if (!session || togglingVisibility.has(postId)) return

    setTogglingVisibility(prev => new Set(prev).add(postId))

    // Trova lo stato attuale del post
    const currentPost = posts.find(post => post.id === postId)
    if (!currentPost) {
      setTogglingVisibility(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      return
    }

    // Aggiornamento ottimistico
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isHidden: !post.isHidden
          }
        }
        return post
      })
    )

    try {
      const response = await fetch(`/api/posts/${postId}/visibility`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        // Se fallisce, reverta l'aggiornamento ottimistico
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                isHidden: currentPost.isHidden
              }
            }
            return post
          })
        )
      }
    } catch (error) {
      console.error('Error toggling post visibility:', error)
      // Se c'è un errore, reverta l'aggiornamento ottimistico
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isHidden: currentPost.isHidden
            }
          }
          return post
        })
      )
    } finally {
      setTogglingVisibility(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleFollow = async (userId: string) => {
    if (!session || followingUsers.has(userId)) return

    // Aggiungi l'utente alla lista di quelli in elaborazione
    setFollowingUsers(prev => new Set(prev).add(userId))

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      })

      if (response.ok) {
        const { isFollowing } = await response.json()
        
        if (isFollowing) {
          // Aggiunto con successo alla lista dei seguiti
          setFollowedUsers(prev => new Set(prev).add(userId))
        } else {
          // Rimosso dalla lista dei seguiti (unfollow)
          setFollowedUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(userId)
            return newSet
          })
        }
      }
    } catch (error) {
      console.error('Error following user:', error)
    } finally {
      // Rimuovi l'utente dalla lista di quelli in elaborazione
      setFollowingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session || deletingComments.has(commentId)) return

    setDeletingComments(prev => new Set(prev).add(commentId))

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Rimuovi il commento dalla lista
        setPosts(prevPosts => 
          prevPosts.map(post => ({
            ...post,
            comments: post.comments.filter(comment => comment.id !== commentId),
            _count: {
              ...post._count,
              comments: post.comments.some(comment => comment.id === commentId) 
                ? post._count.comments - 1 
                : post._count.comments
            }
          }))
        )
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  const handleCommentsLoad = (postId: string, allComments: Comment[]) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: allComments
          }
        }
        return post
      })
    )
  }

  const handleOpenComments = async (postId: string) => {
    // Toggle: se il post è già attivo, chiudi la sidebar
    if (activePostId === postId) {
      handleCloseComments()
      return
    }
    
    setActivePostId(postId)
    
    const post = posts.find(p => p.id === postId)
    if (post && post._count && post._count.comments > 1 && post.comments.length <= 1) {
      // Carica tutti i commenti se non li abbiamo ancora
      setLoadingComments(true)
      try {
        const response = await fetch(`/api/posts/${postId}/comments`)
        if (response.ok) {
          const allComments = await response.json()
          handleCommentsLoad(postId, allComments)
        }
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setLoadingComments(false)
      }
    }
  }

  const handleCloseComments = () => {
    setActivePostId(null)
    setSidebarCommentText('')
  }

  const handleSidebarCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sidebarCommentText.trim() || !activePostId || commentingPosts.has(activePostId)) return

    // Aggiungi il post alla lista di quelli in elaborazione
    setCommentingPosts(prev => new Set(prev).add(activePostId))

    try {
      const response = await fetch(`/api/posts/${activePostId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: sidebarCommentText.trim() }),
      })

      if (response.ok) {
        const newComment = await response.json()
        
        // Aggiorna ottimisticamente la lista dei post
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === activePostId) {
              return {
                ...post,
                comments: [newComment, ...post.comments],
                _count: {
                  ...post._count,
                  comments: post._count.comments + 1
                }
              }
            }
            return post
          })
        )
        setSidebarCommentText('')
        
        // Reset textarea height after clearing content
        setTimeout(() => {
          const textarea = document.querySelector('.comment-textarea') as HTMLTextAreaElement
          if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = '48px'
          }
        }, 0)
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      // Rimuovi il post dalla lista di quelli in elaborazione
      setCommentingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(activePostId)
        return newSet
      })
    }
  }

  // Reset textarea height when content is empty
  useEffect(() => {
    if (!sidebarCommentText) {
      const textarea = document.querySelector('.comment-textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = '48px'
      }
    }
  }, [sidebarCommentText])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">BlogSocial</h1>
          <p className="text-xl text-muted-foreground mb-8">
            A minimalist social platform for meaningful conversations
          </p>
          <div className="space-x-4">
            <Button>
              <a href="/auth/signin">Sign In</a>
            </Button>
            <Button variant="outline">
              <a href="/auth/signup">Sign Up</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="flex">
          {/* Main Feed Column */}
          <div className={`py-6 px-4 transition-all duration-300 ${
            activePostId ? 'w-1/2 pr-4' : 'w-full flex justify-center'
          }`}>
            <div className={`${activePostId ? 'w-full' : 'max-w-2xl w-full'}`}>
              {/* Post Creation */}
              <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
                <form onSubmit={handleSubmit}>
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                        U
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="w-full">
                        <MentionTextareaAdvanced
                          placeholder="What's happening?"
                          value={content}
                          onChange={setContent}
                          className="w-full border-none resize-none focus:outline-none focus:ring-0 text-xl bg-transparent placeholder:text-muted-foreground p-0"
                          maxLength={280}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">
                          {content.length}/280
                        </span>
                        <Button
                          type="submit"
                          disabled={!content.trim() || content.length > 280}
                          loading={posting}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium"
                        >
                          Tweet
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Posts Feed */}
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-3">Loading...</p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        createdAt: new Date(post.createdAt)
                      }}
                      currentUserId={session.user.id}
                      onLike={handleLike}
                      onCommentLike={handleCommentLike}
                      onRepost={handleRepost}
                      onCommentsOpen={handleOpenComments}
                      onDelete={handleDeletePost}
                      onToggleVisibility={handleToggleVisibility}
                      onFollow={handleFollow}
                      isLiking={likingPosts.has(post.id)}
                      isReposting={repostingPosts.has(post.id)}
                      isDeleting={deletingPosts.has(post.id)}
                      isTogglingVisibility={togglingVisibility.has(post.id)}
                      isFollowing={followedUsers.has(post.author.id)}
                      isFollowLoading={followingUsers.has(post.author.id)}
                      likingComments={likingComments}
                      isActive={activePostId === post.id}
                      loadingComments={activePostId === post.id && loadingComments}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nothing to see here — yet</p>
                    <p className="text-sm text-muted-foreground mt-1">When you follow people, you'll see their posts here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Sidebar - Conditionally Visible */}
          {activePostId && activePost && (
            <div className="w-1/2 pl-4 py-6 pr-4 transition-all duration-300">
              <div className="bg-background border border-border rounded-lg shadow-sm sticky top-6 h-[calc(100vh-3rem)] flex flex-col">
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Post Summary + Comment Form - Compacted */}
                  <div className="p-6 border-b border-border flex-shrink-0">
                    {/* Post Summary */}
                    <div className="p-4 bg-muted/20 rounded-lg border border-border/30 mb-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm flex-shrink-0">
                          {activePost.author.name?.[0] || activePost.author.username?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate flex items-center gap-1">
                            {activePost.author.name || activePost.author.username}
                            {activePost.author.isAdmin && (
                              <Shield size={12} className="text-blue-500 fill-current flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 break-words overflow-hidden" style={{ 
                            wordBreak: 'break-word', 
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.4'
                          }}>
                            {activePost.content}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comment Form */}
                    <form onSubmit={handleSidebarCommentSubmit}>
                      <div className="relative overflow-visible">
                        <div className="absolute left-3 top-3 z-20">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                            U
                          </div>
                        </div>
                        <div className="min-w-0">
                          <MentionTextareaAdvanced
                            value={sidebarCommentText}
                            onChange={setSidebarCommentText}
                            onKeyDown={(e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSidebarCommentSubmit(e as any)
                              }
                            }}
                            placeholder="Write a comment..."
                            maxLength={500}
                            className={`comment-textarea w-full border border-border py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background overflow-hidden ${
                              sidebarCommentText.includes('\n') || sidebarCommentText.length > 50
                                ? 'rounded-lg'
                                : 'rounded-full'
                            }`}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!sidebarCommentText.trim() || commentingPosts.has(activePostId)}
                          loading={commentingPosts.has(activePostId)}
                          className="absolute right-3 top-3 z-20 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-6 h-6 p-0 rounded-full flex items-center justify-center shadow-sm"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Comments List - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {loadingComments ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-2">Loading comments...</p>
                      </div>
                    ) : activePost.comments.length > 0 ? (
                      <div className="space-y-4">
                        {activePost.comments
                          .sort((a, b) => {
                            // Prima ordina per numero di like (decrescente)
                            const aLikes = a._count?.likes || a.likes.length
                            const bLikes = b._count?.likes || b.likes.length
                            if (aLikes !== bLikes) {
                              return bLikes - aLikes
                            }
                            // Se hanno lo stesso numero di like, ordina per data (più recenti per primi)
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          })
                          .map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-muted/10 rounded-lg border border-border/20">
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => router.push(`/profile/${comment.user.username}`)}
                                className="w-8 h-8 rounded-full overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                              >
                                {comment.user.avatar ? (
                                  <img 
                                    src={comment.user.avatar} 
                                    alt={comment.user.name || comment.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                                    {comment.user.name?.[0] || comment.user.username?.[0] || 'U'}
                                  </div>
                                )}
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 text-xs mb-1">
                                <button
                                  onClick={() => router.push(`/profile/${comment.user.username}`)}
                                  className="font-medium text-foreground hover:underline flex items-center gap-1"
                                >
                                  {comment.user.name || comment.user.username}
                                  {comment.user.isAdmin && (
                                    <Shield size={12} className="text-blue-500 fill-current" />
                                  )}
                                </button>
                                <span className="text-muted-foreground">
                                  @{comment.user.username}
                                </span>
                                <span className="text-muted-foreground">·</span>
                                <time className="text-muted-foreground">
                                  {formatRelativeTime(comment.createdAt)}
                                </time>
                              </div>
                              <p className="text-base text-foreground leading-normal mb-2 whitespace-pre-wrap break-words hyphens-auto" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
                                <MentionText text={comment.content} />
                              </p>
                              {session && (
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => handleCommentLike(comment.id)}
                                    disabled={likingComments.has(comment.id)}
                                    className={`flex items-center gap-1 p-1 rounded-full transition-colors text-xs ${
                                      session.user.id && comment.likes.some(like => like.userId === session.user.id)
                                        ? 'text-red-600 hover:text-red-700'
                                        : 'text-muted-foreground hover:text-red-600'
                                    } ${likingComments.has(comment.id) ? 'opacity-50' : ''}`}
                                  >
                                    <Heart 
                                      size={12} 
                                      className={session.user.id && comment.likes.some(like => like.userId === session.user.id) ? 'fill-current' : ''} 
                                    />
                                    <span>{comment._count?.likes || comment.likes.length}</span>
                                  </button>
                                  
                                  {session.user.id === comment.user.id && (
                                    <SimpleMenu
                                      align="right"
                                      trigger={
                                        <button className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                          <MoreHorizontal size={14} />
                                        </button>
                                      }
                                      items={[
                                        {
                                          label: (
                                            <div className="flex items-center gap-2">
                                              <Trash2 size={14} />
                                              {deletingComments.has(comment.id) ? 'Deleting...' : 'Delete'}
                                            </div>
                                          ),
                                          onClick: () => {
                                            if (!deletingComments.has(comment.id)) {
                                              handleDeleteComment(comment.id)
                                            }
                                          },
                                          variant: 'destructive'
                                        }
                                      ]}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet</p>
                        <p className="text-xs">Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
