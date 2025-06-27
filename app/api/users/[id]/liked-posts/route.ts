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

    // Trova tutti i post che l'utente ha liked
    const likedPosts = await prisma.like.findMany({
      where: {
        userId: userId,
      },
      include: {
        post: {
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
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Estrai solo i post dai risultati
    const posts = likedPosts.map(likedPost => likedPost.post)

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching liked posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 