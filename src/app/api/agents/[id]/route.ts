import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Error in GET /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    const {
      name,
      brokerage,
      city,
      state,
      neighborhoods,
      website_url,
      property_types,
      buyer_types,
      luxury_threshold,
    } = body

    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Name, city, and state are required' },
        { status: 400 }
      )
    }

    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .update({
        name,
        brokerage: brokerage || null,
        city,
        state,
        neighborhoods: neighborhoods || [],
        website_url: website_url || null,
        property_types: property_types || [],
        buyer_types: buyer_types || [],
        luxury_threshold: luxury_threshold || 1000000,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating agent:', error)
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Error in PUT /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
