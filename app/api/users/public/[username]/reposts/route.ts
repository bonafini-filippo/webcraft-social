import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params

    // Prima verifica se l'utente esiste ed è attivo
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Recupera i post che l'utente ha repostato
    const repostedPosts = await prisma.post.findMany({
      where: {
        reposts: {
          some: {
            userId: user.id
          }
        },
        isPublished: true,
        isHidden: false // Solo post visibili nei profili pubblici
      },
      include: {
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
            parentId: null
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
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
      }
    })

    return NextResponse.json(repostedPosts)
  } catch (error) {
    console.error('Error fetching reposted posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 