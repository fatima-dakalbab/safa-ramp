import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { comparePassword, signToken } from '../../../lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { inspectorId, password } = await req.json()

    if (!inspectorId || !password) {
      return NextResponse.json(
        { error: 'Inspector ID and password are required' },
        { status: 400 }
      )
    }

    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId },
      include: { user: true },
    })

    if (!inspector) {
      return NextResponse.json(
        { error: 'Invalid Inspector ID or password' },
        { status: 401 }
      )
    }

    const valid = await comparePassword(password, inspector.user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid Inspector ID or password' },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: inspector.user.id,
      role: inspector.user.role,
      inspectorId: inspector.id,
    })

    return NextResponse.json({
      token,
      user: {
        id: inspector.user.id,
        name: inspector.user.name,
        email: inspector.user.email,
        role: inspector.user.role,
        inspectorId: inspector.inspectorId,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}