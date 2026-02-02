import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      luxury_threshold 
    } = body

    // Validate required fields
    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Name, city, and state are required' },
        { status: 400 }
      )
    }

    // Get or create user in our database
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({ clerk_user_id: userId, email: '' })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser
    }

    // Get or create workspace for user
    let { data: workspace, error: workspaceError } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      // Create default workspace
      const { data: newWorkspace, error: createError } = await supabaseAdmin
        .from('workspaces')
        .insert({ 
          name: 'My Workspace',
          owner_id: user.id,
          plan: 'free',
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Error creating workspace:', createError)
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
      }
      workspace = newWorkspace
    }

    // Create the agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert({
        workspace_id: workspace.id,
        name,
        brokerage: brokerage || null,
        city,
        state,
        neighborhoods: neighborhoods || [],
        website_url: website_url || null,
        property_types: property_types || [],
        buyer_types: buyer_types || [],
        luxury_threshold: luxury_threshold || 1000000,
        is_primary: true,
      })
      .select()
      .single()

    if (agentError) {
      console.error('Error creating agent:', agentError)
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
    }

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ agents: [] })
    }

    // Get workspace
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ agents: [] })
    }

    // Get agents
    const { data: agents, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error in GET /api/agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
