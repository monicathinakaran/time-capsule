// supabase/functions/search-genius/index.ts

import { serve } from 'std/http/server.ts'

serve(async (req) => {
  // 1. Set up CORS headers to allow requests from your app
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // This is needed for the browser's "preflight" request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Get the search query from the request
    const { query } = await req.json()
    if (!query) {
      throw new Error('Missing "query" parameter.')
    }

    // 3. Get the secret Genius token from your Supabase secrets
    const GENIUS_ACCESS_TOKEN = Deno.env.get('GENIUS_ACCESS_TOKEN')

    // 4. Call the Genius API
    const url = `https://api.genius.com/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from Genius API')
    }

    const data = await response.json()

    // 5. Send the data back to your React app
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})