// supabase/functions/share-item/index.ts
// --- NEW UPGRADED VERSION ---

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Function `share-item` initializing...');

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      recipientEmail, 
      source_item_id, 
      item_type, 
      unlock_date, 
      personal_note 
    } = await req.json()

    console.log('Request body received:', { recipientEmail, item_type });

    // --- DEFENSIVE FIX ---
    // Clean the email address to remove spaces and match casing
    const cleanedEmail = recipientEmail.trim().toLowerCase();

    // 1. Create ADMIN client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Create USER client (to get sender)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user: senderUser }, error: senderError } = await supabaseUser.auth.getUser()
    if (senderError) throw new Error(`Sender auth error: ${senderError.message}`)
    if (!senderUser) throw new Error('Sender not found (is user authenticated?)')

    console.log(`Sender ID: ${senderUser.id}`);

    // 3. Find recipient using the CLEANED email
    console.log(`Querying for recipient with email: "${cleanedEmail}"`);
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanedEmail) // <-- Use cleaned email
      .single()

    // --- BETTER ERROR ---
    if (recipientError) {
      console.error('Recipient query error:', recipientError.message);
      throw new Error(`Database error looking for recipient: ${recipientError.message}`)
    }
    if (!recipientProfile) {
      console.warn(`Recipient not found for email: "${cleanedEmail}"`);
      return new Response(JSON.stringify({ error: 'Recipient user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Recipient ID found: ${recipientProfile.id}`);

    // 4. Insert into shared_items table
    console.log('Inserting into shared_items...');
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('shared_items')
      .insert({
        sender_id: senderUser.id,
        recipient_id: recipientProfile.id,
        source_item_id: source_item_id,
        item_type: item_type,
        unlock_date: unlock_date,
        personal_note: personal_note
      })
      .select() // Use .select() instead of .single() on insert
      .single()

    // --- BETTER ERROR ---
    if (insertError) {
      console.error('Insert error:', insertError.message);
      throw new Error(`Database insert error: ${insertError.message}`)
    }

    console.log('Share item created successfully:', newItem.id);

    // 5. Success
    return new Response(JSON.stringify(newItem), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // --- CATCH-ALL ERROR ---
    console.error('Caught in catch block:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for a bad request/generic error
    })
  }
})