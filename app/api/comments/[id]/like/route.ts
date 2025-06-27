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
    const commentId = id
    const userId = session.user.id

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      )
    }

    // Usa una transazione per operazioni atomiche
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already liked the comment
      const existingLike = await tx.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId
          }
        }
      })

      if (existingLike) {
        // Unlike the comment
        await tx.commentLike.delete({
          where: {
            userId_commentId: {
              userId,
              commentId
            }
          }
        })
        return { action: 'unliked', message: 'Comment unliked' }
      } else {
        // Like the comment
        await tx.commentLike.upsert({
          where: {
            userId_commentId: {
              userId,
              commentId
            }
          },
          update: {}, // Non fare nulla se esiste già
          create: {
            userId,
            commentId
          }
        })
        return { action: 'liked', message: 'Comment liked' }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling comment like:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 