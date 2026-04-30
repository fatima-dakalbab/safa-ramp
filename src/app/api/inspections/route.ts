import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'
import { verifyToken } from '../../lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        aircraft: true,
        operator: true,
        _count: { select: { findings: true } },
      },
    })

    const total = inspections.length
    const withFindings = inspections.filter(i => (i._count?.findings || 0) > 0).length
    const submitted = inspections.filter(i => i.status === 'CLOSED' || i.status === 'APPROVED').length
    const drafts = inspections.filter(i => i.status === 'DRAFT').length

    return NextResponse.json({
      inspections,
      stats: { total, withFindings, submitted, drafts },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()

    const inspection = await prisma.inspection.create({
      data: {
        poiNumber: body.poiNumber,
        date: new Date(body.date),
        startTime: body.startTime ? new Date(`${body.date}T${body.startTime}`) : null,
        endTime: body.endTime ? new Date(`${body.date}T${body.endTime}`) : null,
        place: body.place || 'OMDB',
        inspectionType: body.inspectionType || 'FULL',
        flightType: body.flightType || null,
        alcoholTest: body.alcoholTest === 'true',
        flightCrew: parseInt(body.flightCrew) || 0,
        cabinCrew: parseInt(body.cabinCrew) || 0,
        status: body.status || 'DRAFT',
        aircraft: body.registration ? {
          create: {
            registration: body.registration,
            typeModel: body.typeModel || null,
            configuration: body.configuration || null,
            msn: body.msn || null,
          }
        } : undefined,
        operator: body.airlineName ? {
          create: {
            airlineName: body.airlineName,
            aoc: body.aoc || null,
            stateOfRegistry: body.stateOfRegistry || null,
            charteredBy: body.charteredBy || null,
            chartererState: body.chartererState || null,
            routeFrom: body.routeFrom || null,
            flightNoIn: body.flightNoIn || null,
            routeTo: body.routeTo || null,
            flightNoOut: body.flightNoOut || null,
          }
        } : undefined,
      },
    })

    return NextResponse.json({
      inspectionId: inspection.id,
      poiNumber: inspection.poiNumber,
    }, { status: 201 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}