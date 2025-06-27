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
    const targetUserId = id
    const currentUserId = session.user.id

    // Non permettere di seguire se stesso
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { message: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Verifica se l'utente target esiste ed è attivo
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true }
    })

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Verifica se già sta seguendo questo utente
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    let isFollowing: boolean

    if (existingFollow) {
      // Se già sta seguendo, rimuovi il follow (unfollow)
      await prisma.follow.delete({
        where: {
          id: existingFollow.id
        }
      })
      isFollowing = false
    } else {
      // Se non sta seguendo, aggiungi il follow
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      })
      isFollowing = true
    }

    return NextResponse.json({ isFollowing })
  } catch (error) {
    console.error('Error following/unfollowing user:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 