import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id
    
    // Se non è loggato, non mostra nessun post
    if (!currentUserId) {
      return NextResponse.json([])
    }

    // Ottieni la lista degli utenti che segui
    const following = await prisma.follow.findMany({
      where: {
        followerId: currentUserId
      },
      select: {
        followingId: true
      }
    })

    const followingIds = following.map(f => f.followingId)

    const posts = await prisma.post.findMany({
      where: {
        isHidden: false, // Solo post visibili
        OR: [
          { authorId: { in: followingIds } }, // Post delle persone che segui
          { author: { isAdmin: true } }, // Post dell'admin
          { authorId: currentUserId } // I tuoi post
        ]
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isHidden: true,
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            isAdmin: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                isAdmin: true,
              }
            },
            _count: {
              select: {
                likes: true,
                replies: true
              }
            },
            likes: {
              select: {
                id: true,
                userId: true,
              }
            }
          },
          where: {
            parentId: null // Solo commenti top-level
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1 // Solo il primo per l'anteprima
        },
        reposts: {
          select: {
            id: true,
            userId: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 280) {
      return NextResponse.json(
        { message: 'Content must be 280 characters or less' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isHidden: true,
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            isAdmin: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                isAdmin: true,
              }
            },
            _count: {
              select: {
                likes: true,
                replies: true
              }
            },
            likes: {
              select: {
                id: true,
                userId: true,
              }
            }
          },
          where: {
            parentId: null // Solo commenti top-level
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1 // Solo il primo per l'anteprima
        },
        reposts: {
          select: {
            id: true,
            userId: true,
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 