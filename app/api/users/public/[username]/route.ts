import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { username } = await context.params

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        isActive: true,
        isAdmin: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        },
        // Se c'è una sessione, verifica se l'utente corrente sta seguendo questo utente
        followers: session?.user?.id ? {
          where: {
            followerId: session.user.id
          },
          select: {
            id: true
          }
        } : false
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Determina se l'utente corrente sta seguendo questo utente
    const isFollowing = session?.user?.id ? user.followers.length > 0 : false

    // Rimuovi il campo followers dalla risposta e aggiungi isFollowing
    const { followers, ...userWithoutFollowers } = user
    const responseUser = {
      ...userWithoutFollowers,
      isFollowing
    }

    return NextResponse.json(responseUser)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 