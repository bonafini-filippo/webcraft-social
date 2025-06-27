import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalUsers, totalPosts, activeUsers, postsToday] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.user.count({
        where: {
          isActive: true
        }
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalPosts,
      activeUsers,
      postsToday
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 