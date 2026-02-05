import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_USER_IDS = ['user_REPLACE_WITH_YOUR_CLERK_USER_ID']

export async function GET() {
  const { userId } = await auth()
  
  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all scans with related data
  const { data: scans, error } = await supabaseAdmin
    .from('scans')
    .select(`
      id,
      prompt_rendered,
      llm_provider,
      llm_model,
      response_raw,
      mentioned,
      mention_rank,
      mention_context,
      sentiment,
      competitors_mentioned,
      sources_cited,
      latency_ms,
      scanned_at,
      agent_id
    `)
    .order('scanned_at', { ascending: false })
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Convert to CSV
  const headers = [
    'scan_id',
    'agent_id',
    'scanned_at',
    'llm_provider',
    'llm_model',
    'prompt',
    'mentioned',
    'mention_rank',
    'sentiment',
    'competitors',
    'sources',
    'latency_ms',
  ]

  const rows = scans.map(scan => [
    scan.id,
    scan.agent_id,
    scan.scanned_at,
    scan.llm_provider,
    scan.llm_model,
    `"${(scan.prompt_rendered || '').replace(/"/g, '""')}"`,
    scan.mentioned,
    scan.mention_rank || '',
    scan.sentiment || '',
    `"${JSON.stringify(scan.competitors_mentioned || []).replace(/"/g, '""')}"`,
    `"${JSON.stringify(scan.sources_cited || []).replace(/"/g, '""')}"`,
    scan.latency_ms || '',
  ])

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="notable-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
