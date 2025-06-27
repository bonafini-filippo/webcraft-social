import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.id
      },
      select: {
        followingId: true
      }
    })

    const followingIds = following.map(f => f.followingId)
    
    return NextResponse.json({ followingIds })
  } catch (error) {
    console.error('Error fetching following users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 