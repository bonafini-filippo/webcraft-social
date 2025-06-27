import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params

    // Verifica che il post esista e appartenga all'utente
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { 
        id: true, 
        authorId: true, 
        isHidden: true 
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Toggle della visibilità
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { 
        isHidden: !post.isHidden 
      },
      select: {
        id: true,
        isHidden: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      isHidden: updatedPost.isHidden 
    })

  } catch (error) {
    console.error('Error toggling post visibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 