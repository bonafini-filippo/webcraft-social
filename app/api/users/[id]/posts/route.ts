import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const userId = id

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        isPublished: true,
        isHidden: false  // Nel tab "Posts" mostra solo quelli visibili
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
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 