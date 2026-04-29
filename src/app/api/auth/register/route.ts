import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { hashPassword } from '../../../lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, inspectorId, password, role } = await req.json()

    if (!name || !email || !inspectorId || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const existingInspector = await prisma.inspector.findUnique({
      where: { inspectorId },
    })
    if (existingInspector) {
      return NextResponse.json(
        { error: 'This Inspector ID is already registered' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role: role || 'INSPECTOR' },
      })
      const inspector = await tx.inspector.create({
        data: { inspectorId, userId: user.id },
      })
      return { user, inspector }
    })

    return NextResponse.json({
      message: 'Account created successfully',
      userId: result.user.id,
    }, { status: 201 })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}