'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Button } from '../../../components/ui/Button'
import { SimpleMenu } from '../../../components/ui/SimpleMenu'
import PostCard from '../../../components/PostCard'
import MentionTextareaAdvanced from '../../../components/ui/MentionTextareaAdvanced'
import MentionText from '../../../components/ui/MentionText'
import { formatDate, formatRelativeTime } from '../../../lib/utils'
import { Calendar, Heart, MessageCircle, UserPlus, UserMinus, MoreHorizontal, Trash2, EyeOff, FileText, Repeat2, Shield } from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  name?: string
  bio?: string
  avatar?: string
  createdAt: string
  isFollowing?: boolean
  isAdmin?: boolean
  _count: {
    posts: number
    followers: number
    following: number
  }
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

export default function UserProfile() {
  const { data: session } = useSession()
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [repostedPosts, setRepostedPosts] = useState<Post[]>([])
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([])
  const [hiddenPosts, setHiddenPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLikedPosts, setLoadingLikedPosts] = useState(false)
  const [loadingRepostedPosts, setLoadingRepostedPosts] = useState(false)
  const [loadingCommentedPosts, setLoadingCommentedPosts] = useState(false)
  const [loadingHiddenPosts, setLoadingHiddenPosts] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())
  const [repostingPosts, setRepostingPosts] = useState<Set<string>>(new Set())
  const [commentingPosts, setCommentingPosts] = useState<Set<string>>(new Set())
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())
  const [deletingPosts, setDeletingPosts] = useState<Set<string>>(new Set())
  const [togglingVisibility, setTogglingVisibility] = useState<Set<string>>(new Set())
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set())
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [sidebarCommentText, setSidebarCommentText] = useState('')
  const [followLoading, setFollowLoading] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [followedUsersInitialized, setFollowedUsersInitialized] = useState(false)

  // Trova il post attivo (cerca in tutte le liste)
  const activePost = activePostId ? 
    posts.find(post => post.id === activePostId) || 
    likedPosts.find(post => post.id === activePostId) ||
    repostedPosts.find(post => post.id === activePostId) ||
    commentedPosts.find(post => post.id === activePostId) ||
    hiddenPosts.find(post => post.id === activePostId) : null

  // Controlla se è il proprio profilo
  const isOwnProfile = session?.user?.username === username

  useEffect(() => {
    if (username) {
      fetchProfile()
      fetchUserPosts()
    }
  }, [username])

  // Carica gli utenti seguiti quando la sessione è disponibile
  useEffect(() => {
    if (session?.user?.id && !followedUsersInitialized) {
      fetchFollowedUsers()
    }
  }, [session?.user?.id, followedUsersInitialized])

  // Sincronizza lo stato followedUsers con profile.isFollowing
  useEffect(() => {
    if (profile && profile.isFollowing) {
      setFollowedUsers(prev => new Set(prev).add(profile.id))
    } else if (profile && profile.isFollowing === false) {
      setFollowedUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(profile.id)
        return newSet
      })
    }
  }, [profile?.isFollowing, profile?.id])

  const fetchProfile = async () => {
    try {
      // Se è il proprio profilo, usa le API private per ottenere tutti i dati
      const apiPath = isOwnProfile 
        ? `/api/users/${session?.user?.id}`
        : `/api/users/public/${username}`
      const response = await fetch(apiPath)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      // Se è il proprio profilo, usa le API private per ottenere tutti i dati
      const apiPath = isOwnProfile 
        ? `/api/users/${session?.user?.id}/posts`
        : `/api/users/public/${username}/posts`
      const response = await fetch(apiPath)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
    }
    setLoading(false)
  }

  const fetchLikedPosts = async () => {
    if (loadingLikedPosts || likedPosts.length > 0) return
    
    setLoadingLikedPosts(true)
    try {
      const apiPath = isOwnProfile 
        ? `/api/users/${session?.user?.id}/liked-posts`
        : `/api/users/public/${username}/liked-posts`
      const response = await fetch(apiPath)
      if (response.ok) {
        const data = await response.json()
        setLikedPosts(data)
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
    }
    setLoadingLikedPosts(false)
  }

  const fetchRepostedPosts = async () => {
    if (loadingRepostedPosts || repostedPosts.length > 0) return
    
    setLoadingRepostedPosts(true)
    try {
      const apiPath = isOwnProfile 
        ? `/api/users/${session?.user?.id}/reposts`
        : `/api/users/public/${username}/reposts`
      const response = await fetch(apiPath)
      if (response.ok) {
        const data = await response.json()
        setRepostedPosts(data)
      }
    } catch (error) {
      console.error('Error fetching reposted posts:', error)
    }
    setLoadingRepostedPosts(false)
  }

  const fetchCommentedPosts = async () => {
    if (loadingCommentedPosts || commentedPosts.length > 0) return
    
    setLoadingCommentedPosts(true)
    try {
      const apiPath = isOwnProfile 
        ? `/api/users/${session?.user?.id}/commented-posts`
        : `/api/users/public/${username}/commented-posts`
      const response = await fetch(apiPath)
      if (response.ok) {
        const data = await response.json()
        setCommentedPosts(data)
      }
    } catch (error) {
      console.error('Error fetching commented posts:', error)
    }
    setLoadingCommentedPosts(false)
  }

  const fetchHiddenPosts = async () => {
    // Solo per il proprio profilo
    if (!isOwnProfile || loadingHiddenPosts || hiddenPosts.length > 0) return
    
    setLoadingHiddenPosts(true)
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/hidden-posts`)
      if (response.ok) {
        const data = await response.json()
        setHiddenPosts(data)
      }
    } catch (error) {
      console.error('Error fetching hidden posts:', error)
    }
    setLoadingHiddenPosts(false)
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    if (tab === 'likes' && likedPosts.length === 0) {
      fetchLikedPosts()
    } else if (tab === 'reposts' && repostedPosts.length === 0) {
      fetchRepostedPosts()
    } else if (tab === 'comments' && commentedPosts.length === 0) {
      fetchCommentedPosts()
    } else if (tab === 'hidden' && hiddenPosts.length === 0) {
      fetchHiddenPosts()
    }
  }

  const handleFollow = async () => {
    if (!session || !profile || followLoading) return

    setFollowLoading(true)
    
    try {
      const response = await fetch(`/api/users/${profile.id}/follow`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: data.isFollowing,
          _count: {
            ...prev._count,
            followers: data.isFollowing ? prev._count.followers + 1 : prev._count.followers - 1
          }
        } : null)
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
    }
    
    setFollowLoading(false)
  }

  const handleCardFollow = async (userId: string) => {
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

  const handleLike = async (postId: string) => {
    if (!session) return

    if (likingPosts.has(postId)) {
      return
    }

    setLikingPosts(prev => new Set(prev).add(postId))

    const currentPost = posts.find(post => post.id === postId) || 
                       likedPosts.find(post => post.id === postId) ||
                       repostedPosts.find(post => post.id === postId) ||
                       commentedPosts.find(post => post.id === postId) ||
                       hiddenPosts.find(post => post.id === postId)
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

    const updatePosts = (prevPosts: Post[]) => 
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

    setPosts(updatePosts)
    setRepostedPosts(updatePosts)
    setCommentedPosts(updatePosts)
    setHiddenPosts(updatePosts)
    setLikedPosts(prevLikedPosts => {
      if (isCurrentlyLiked) {
        return prevLikedPosts.filter(post => post.id !== postId)
      }
      const isPostInLikedPosts = prevLikedPosts.some(post => post.id === postId)
      if (!isPostInLikedPosts) {
        const updatedPost = updatePosts([currentPost])[0]
        return [updatedPost, ...prevLikedPosts]
      }
      return updatePosts(prevLikedPosts)
    })

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        const revertPosts = (prevPosts: Post[]) => 
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

        setPosts(revertPosts)
        setLikedPosts(revertPosts)
        setRepostedPosts(revertPosts)
        setCommentedPosts(revertPosts)
        setHiddenPosts(revertPosts)
      }
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleRepost = async (postId: string) => {
    if (!session) return

    if (repostingPosts.has(postId)) {
      return
    }

    setRepostingPosts(prev => new Set(prev).add(postId))

    const currentPost = posts.find(post => post.id === postId) || 
                       likedPosts.find(post => post.id === postId) ||
                       repostedPosts.find(post => post.id === postId) ||
                       commentedPosts.find(post => post.id === postId) ||
                       hiddenPosts.find(post => post.id === postId)
    if (!currentPost) {
      setRepostingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      return
    }

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

    const updatePosts = (prevPosts: Post[]) => 
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

    setPosts(updatePosts)
    setLikedPosts(updatePosts)
    setCommentedPosts(updatePosts)
    setHiddenPosts(updatePosts)
    setRepostedPosts(prevRepostedPosts => {
      if (isCurrentlyReposted) {
        return prevRepostedPosts.filter(post => post.id !== postId)
      }
      const isPostInRepostedPosts = prevRepostedPosts.some(post => post.id === postId)
      if (!isPostInRepostedPosts) {
        const updatedPost = updatePosts([currentPost])[0]
        return [{ ...updatedPost, repostedAt: new Date().toISOString(), isRepost: true }, ...prevRepostedPosts]
      }
      return updatePosts(prevRepostedPosts)
    })

    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Revert logic here
      }
    } catch (error) {
      console.error('Error reposting post:', error)
    } finally {
      setRepostingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!session) return

    if (likingComments.has(commentId)) {
      return
    }

    setLikingComments(prev => new Set(prev).add(commentId))

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

    if (!currentComment) {
      likedPosts.forEach((post, pIndex) => {
        const cIndex = post.comments.findIndex(c => c.id === commentId)
        if (cIndex !== -1) {
          currentComment = post.comments[cIndex]
          postIndex = pIndex
          commentIndex = cIndex
        }
      })
    }

    if (!currentComment) {
      repostedPosts.forEach((post, pIndex) => {
        const cIndex = post.comments.findIndex(c => c.id === commentId)
        if (cIndex !== -1) {
          currentComment = post.comments[cIndex]
          postIndex = pIndex
          commentIndex = cIndex
        }
      })
    }

    if (!currentComment) {
      commentedPosts.forEach((post, pIndex) => {
        const cIndex = post.comments.findIndex(c => c.id === commentId)
        if (cIndex !== -1) {
          currentComment = post.comments[cIndex]
          postIndex = pIndex
          commentIndex = cIndex
        }
      })
    }

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

    const updateComments = (prevPosts: Post[]) => 
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

    setPosts(updateComments)
    setLikedPosts(updateComments)
    setRepostedPosts(updateComments)
    setCommentedPosts(updateComments)

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Revert logic
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    } finally {
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
        // Rimuovi il post da tutte le liste
        setPosts(prev => prev.filter(post => post.id !== postId))
        setLikedPosts(prev => prev.filter(post => post.id !== postId))
        setRepostedPosts(prev => prev.filter(post => post.id !== postId))
        setCommentedPosts(prev => prev.filter(post => post.id !== postId))
        setHiddenPosts(prev => prev.filter(post => post.id !== postId))
        
        // Se era il post attivo, chiudi la sidebar
        if (activePostId === postId) {
          setActivePostId(null)
          setSidebarCommentText('')
        }

        // Aggiorna il conteggio dei post nel profilo
        setProfile(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            posts: prev._count.posts - 1
          }
        } : null)
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
    const currentPost = posts.find(post => post.id === postId) || 
                       likedPosts.find(post => post.id === postId) ||
                       repostedPosts.find(post => post.id === postId) ||
                       commentedPosts.find(post => post.id === postId) ||
                       hiddenPosts.find(post => post.id === postId)
    if (!currentPost) {
      setTogglingVisibility(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
      return
    }

    const wasHidden = currentPost.isHidden
    const updatedPost = { ...currentPost, isHidden: !wasHidden }

    // Aggiornamento ottimistico: sposta il post tra le liste
    if (wasHidden) {
      // Il post stava nascosto, ora diventa visibile
      // Rimuovilo da hiddenPosts e aggiungilo a posts se è l'autore
      setHiddenPosts(prev => prev.filter(post => post.id !== postId))
      if (currentPost.author.id === session.user.id) {
        setPosts(prev => [updatedPost, ...prev])
      }
    } else {
      // Il post era visibile, ora diventa nascosto
      // Rimuovilo da posts e aggiungilo a hiddenPosts
      setPosts(prev => prev.filter(post => post.id !== postId))
      setHiddenPosts(prev => [updatedPost, ...prev])
    }

    // Aggiorna il post nelle altre liste mantenendolo
    const updatePostVisibility = (prevPosts: Post[]) => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return updatedPost
        }
        return post
      })

    setLikedPosts(updatePostVisibility)
    setRepostedPosts(updatePostVisibility)
    setCommentedPosts(updatePostVisibility)

    try {
      const response = await fetch(`/api/posts/${postId}/visibility`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        // Se fallisce, reverta l'aggiornamento ottimistico
        if (wasHidden) {
          // Ripristina: rimuovi da posts e rimetti in hiddenPosts
          setPosts(prev => prev.filter(post => post.id !== postId))
          setHiddenPosts(prev => [currentPost, ...prev])
        } else {
          // Ripristina: rimuovi da hiddenPosts e rimetti in posts
          setHiddenPosts(prev => prev.filter(post => post.id !== postId))
          setPosts(prev => [currentPost, ...prev])
        }

        const revertPostVisibility = (prevPosts: Post[]) => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return currentPost
            }
            return post
          })

        setLikedPosts(revertPostVisibility)
        setRepostedPosts(revertPostVisibility)
        setCommentedPosts(revertPostVisibility)
      }
    } catch (error) {
      console.error('Error toggling post visibility:', error)
      // Se c'è un errore, reverta l'aggiornamento ottimistico
      if (wasHidden) {
        // Ripristina: rimuovi da posts e rimetti in hiddenPosts
        setPosts(prev => prev.filter(post => post.id !== postId))
        setHiddenPosts(prev => [currentPost, ...prev])
      } else {
        // Ripristina: rimuovi da hiddenPosts e rimetti in posts
        setHiddenPosts(prev => prev.filter(post => post.id !== postId))
        setPosts(prev => [currentPost, ...prev])
      }

      const revertPostVisibility = (prevPosts: Post[]) => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return currentPost
          }
          return post
        })

      setLikedPosts(revertPostVisibility)
      setRepostedPosts(revertPostVisibility)
      setCommentedPosts(revertPostVisibility)
    } finally {
      setTogglingVisibility(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
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
        // Rimuovi il commento da tutti i post in tutte le liste
        const removeCommentFromPosts = (prevPosts: Post[]) => 
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

        setPosts(removeCommentFromPosts)
        setLikedPosts(removeCommentFromPosts)
        setRepostedPosts(removeCommentFromPosts)
        setCommentedPosts(removeCommentFromPosts)
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
    const updateComments = (prevPosts: Post[]) => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: allComments
          }
        }
        return post
      })

    setPosts(updateComments)
    setLikedPosts(updateComments)
    setRepostedPosts(updateComments)
    setCommentedPosts(updateComments)
    setHiddenPosts(updateComments)
  }

  const handleOpenComments = async (postId: string) => {
    if (activePostId === postId) {
      handleCloseComments()
      return
    }
    
    setActivePostId(postId)
    
    const post = posts.find(p => p.id === postId) || likedPosts.find(p => p.id === postId) || repostedPosts.find(p => p.id === postId) || commentedPosts.find(p => p.id === postId) || hiddenPosts.find(p => p.id === postId)
    if (post && post._count && post._count.comments > 1 && post.comments.length <= 1) {
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
        
        const updatePostsWithComment = (prevPosts: Post[]) => 
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

        setPosts(updatePostsWithComment)
        setLikedPosts(updatePostsWithComment)
        setRepostedPosts(updatePostsWithComment)
        setCommentedPosts(updatePostsWithComment)
        setHiddenPosts(updatePostsWithComment)
        setSidebarCommentText('')
        
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
      setCommentingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(activePostId)
        return newSet
      })
    }
  }

  useEffect(() => {
    if (!sidebarCommentText) {
      const textarea = document.querySelector('.comment-textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = '48px'
      }
    }
  }, [sidebarCommentText])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="flex">
          <div className={`py-6 px-4 transition-all duration-300 ${
            activePostId ? 'w-1/2 pr-4' : 'w-full flex justify-center'
          }`}>
            <div className={`${activePostId ? 'w-full' : 'max-w-2xl w-full'}`}>
              {/* Profile Header */}
              <div className="bg-card rounded-lg border border-border p-6 mb-6">
                <div className="flex items-start space-x-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold flex-shrink-0">
                    {profile?.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.name || profile.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      profile?.name?.[0] || profile?.username?.[0] || 'U'
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        {profile?.name || profile?.username}
                        {profile?.isAdmin && (
                          <Shield size={18} className="text-blue-500 fill-current" />
                        )}
                      </h1>
                      {session && (
                        isOwnProfile ? (
                          <Button variant="outline" size="sm">
                            Edit Profile
                          </Button>
                        ) : (
                          <Button 
                            variant={profile.isFollowing ? "outline" : "primary"}
                            size="sm"
                            onClick={handleFollow}
                            disabled={followLoading}
                          >
                            {followLoading ? (
                              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : profile.isFollowing ? (
                              <UserMinus className="w-4 h-4 mr-2" />
                            ) : (
                              <UserPlus className="w-4 h-4 mr-2" />
                            )}
                            {profile.isFollowing ? 'Unfollow' : 'Follow'}
                          </Button>
                        )
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex space-x-6 mb-4">
                      <div className="text-center">
                        <div className="font-bold text-lg">{profile?._count.posts || 0}</div>
                        <div className="text-muted-foreground text-sm">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{profile?._count.followers || 0}</div>
                        <div className="text-muted-foreground text-sm">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{profile?._count.following || 0}</div>
                        <div className="text-muted-foreground text-sm">Following</div>
                      </div>
                    </div>

                    {/* Bio */}
                    {profile?.bio && (
                      <p className="text-foreground mb-3">{profile.bio}</p>
                    )}

                    {/* Join Date */}
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar size={16} className="mr-1" />
                      <span>Joined {formatDate(profile?.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => handleTabChange('posts')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'posts'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText size={16} />
                  Posts
                </button>
                {/* Tab Hidden visibile solo nel proprio profilo */}
                {isOwnProfile && (
                  <button
                    onClick={() => handleTabChange('hidden')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
                      activeTab === 'hidden'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <EyeOff size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleTabChange('likes')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'likes'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Heart size={16} />
                  Likes
                </button>
                <button
                  onClick={() => handleTabChange('reposts')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'reposts'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Repeat2 size={16} />
                  Reposts
                </button>
                <button
                  onClick={() => handleTabChange('comments')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'comments'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageCircle size={16} />
                  Comments
                </button>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {posts.length > 0 ? (
                      posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            createdAt: new Date(post.createdAt)
                          }}
                          currentUserId={session?.user?.id}
                          onLike={handleLike}
                          onCommentLike={handleCommentLike}
                          onRepost={handleRepost}
                          onCommentsOpen={handleOpenComments}
                          onDelete={handleDeletePost}
                          onToggleVisibility={handleToggleVisibility}
                          onFollow={handleCardFollow}
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
                        <p className="text-muted-foreground">No posts yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'hidden' && isOwnProfile && (
                  <div className="space-y-4">
                    {loadingHiddenPosts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-3">Loading hidden posts...</p>
                      </div>
                    ) : hiddenPosts.length > 0 ? (
                      hiddenPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            createdAt: new Date(post.createdAt)
                          }}
                          currentUserId={session?.user?.id}
                          onLike={handleLike}
                          onCommentLike={handleCommentLike}
                          onRepost={handleRepost}
                          onCommentsOpen={handleOpenComments}
                          onDelete={handleDeletePost}
                          onToggleVisibility={handleToggleVisibility}
                          onFollow={handleCardFollow}
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
                        <p className="text-muted-foreground">No hidden posts yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Posts you hide will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'likes' && (
                  <div className="space-y-4">
                    {loadingLikedPosts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-3">Loading liked posts...</p>
                      </div>
                    ) : likedPosts.length > 0 ? (
                      likedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            createdAt: new Date(post.createdAt)
                          }}
                          currentUserId={session?.user?.id}
                          onLike={handleLike}
                          onCommentLike={handleCommentLike}
                          onRepost={handleRepost}
                          onCommentsOpen={handleOpenComments}
                          onDelete={handleDeletePost}
                          onToggleVisibility={handleToggleVisibility}
                          onFollow={handleCardFollow}
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
                        <p className="text-muted-foreground">No liked posts yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reposts' && (
                  <div className="space-y-4">
                    {loadingRepostedPosts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-3">Loading reposted posts...</p>
                      </div>
                    ) : repostedPosts.length > 0 ? (
                      repostedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            createdAt: new Date(post.createdAt)
                          }}
                          currentUserId={session?.user?.id}
                          onLike={handleLike}
                          onCommentLike={handleCommentLike}
                          onRepost={handleRepost}
                          onCommentsOpen={handleOpenComments}
                          onDelete={handleDeletePost}
                          onToggleVisibility={handleToggleVisibility}
                          onFollow={handleCardFollow}
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
                        <p className="text-muted-foreground">No reposted posts yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {loadingCommentedPosts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-3">Loading commented posts...</p>
                      </div>
                    ) : commentedPosts.length > 0 ? (
                      commentedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            createdAt: new Date(post.createdAt)
                          }}
                          currentUserId={session?.user?.id}
                          onLike={handleLike}
                          onCommentLike={handleCommentLike}
                          onRepost={handleRepost}
                          onCommentsOpen={handleOpenComments}
                          onDelete={handleDeletePost}
                          onToggleVisibility={handleToggleVisibility}
                          onFollow={handleCardFollow}
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
                        <p className="text-muted-foreground">No commented posts yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Sidebar - Identica alla pagina profile */}
          {activePostId && activePost && (
            <div className="w-1/2 pl-4 py-6 pr-4 transition-all duration-300">
              <div className="bg-background border border-border rounded-lg shadow-sm sticky top-6 h-[calc(100vh-3rem)] flex flex-col">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-border flex-shrink-0">
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

                                          {session && (
                        <form onSubmit={handleSidebarCommentSubmit}>
                          <div className="relative">
                            <div className="absolute left-3 top-3 z-10">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                                {session.user.name?.[0] || session.user.email?.[0] || 'U'}
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
                                className={`comment-textarea w-full border border-border py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background resize-none ${
                                  sidebarCommentText.includes('\n') || sidebarCommentText.length > 50
                                    ? 'rounded-lg min-h-[48px] max-h-[120px] overflow-y-auto'
                                    : 'rounded-full h-12 overflow-hidden'
                                }`}
                              />
                            </div>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={!sidebarCommentText.trim() || commentingPosts.has(activePostId)}
                              loading={commentingPosts.has(activePostId)}
                              className="absolute right-3 top-3 z-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-6 h-6 p-0 rounded-full flex items-center justify-center shadow-sm"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Button>
                          </div>
                        </form>
                      )}
                  </div>

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
                            const aLikes = a._count?.likes || a.likes.length
                            const bLikes = b._count?.likes || b.likes.length
                            if (aLikes !== bLikes) {
                              return bLikes - aLikes
                            }
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          })
                          .map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-muted/10 rounded-lg border border-border/20">
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => window.location.href = `/profile/${comment.user.username}`}
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
                                  onClick={() => window.location.href = `/profile/${comment.user.username}`}
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
