import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function POST(
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
    const postId = id
    const userId = session.user.id

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      )
    }

    // Non permettere di repostare i propri post
    if (post.authorId === userId) {
      return NextResponse.json(
        { message: 'You cannot repost your own posts' },
        { status: 400 }
      )
    }

    // Usa una transazione per operazioni atomiche
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already reposted the post
      const existingRepost = await tx.repost.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      })

      if (existingRepost) {
        // Remove repost
        await tx.repost.delete({
          where: {
            userId_postId: {
              userId,
              postId
            }
          }
        })
        return { action: 'unreposted', message: 'Post unreposted' }
      } else {
        // Add repost
        await tx.repost.upsert({
          where: {
            userId_postId: {
              userId,
              postId
            }
          },
          update: {}, // Non fare nulla se esiste già
          create: {
            userId,
            postId
          }
        })
        return { action: 'reposted', message: 'Post reposted' }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling repost:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 