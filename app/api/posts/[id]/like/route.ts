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

    // Usa una transazione per operazioni atomiche
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already liked the post
      const existingLike = await tx.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      })

      if (existingLike) {
        // Unlike the post
        await tx.like.delete({
          where: {
            userId_postId: {
              userId,
              postId
            }
          }
        })
        return { action: 'unliked', message: 'Post unliked' }
      } else {
        // Like the post - usa upsert per evitare duplicati
        await tx.like.upsert({
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
        return { action: 'liked', message: 'Post liked' }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 