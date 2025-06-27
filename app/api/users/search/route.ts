import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

    const searchTerm = query.trim()

    // Cerca utenti per username o nome
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              {
                username: {
                  contains: searchTerm
                }
              },
              {
                name: {
                  contains: searchTerm
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
      orderBy: [
        {
          username: 'asc'
        }
      ],
      take: 10 // Limita i risultati a 10 utenti
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 