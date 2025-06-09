
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Authenticated user:', user.id)

    const { name, description, price, stockLevel, farmerId, imageUrl, category, unit, isOrganic } = await req.json()

    console.log('Received farmer ID:', farmerId)

    // First verify that the farmer exists and belongs to the current user
    const { data: farmer, error: farmerError } = await supabaseClient
      .from('farmers')
      .select('id, user_id')
      .eq('id', farmerId)
      .eq('user_id', user.id)
      .single()

    if (farmerError || !farmer) {
      console.error('Farmer verification error:', farmerError)
      console.log('No farmer found for ID:', farmerId, 'and user ID:', user.id)
      
      // Try to create a farmer record if it doesn't exist
      console.log('Attempting to create farmer record...')
      const { data: newFarmer, error: createFarmerError } = await supabaseClient
        .from('farmers')
        .insert({
          user_id: user.id,
          farm_name: 'My Farm', // Default farm name
          farm_location: 'Unknown' // Default location
        })
        .select()
        .single()

      if (createFarmerError) {
        console.error('Failed to create farmer record:', createFarmerError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create farmer profile', 
            details: createFarmerError.message 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Created new farmer record:', newFarmer)
      // Use the newly created farmer ID
      farmerId = newFarmer.id
    } else {
      console.log('Farmer verified:', farmer)
    }

    // Create the product
    console.log('Creating product with farmer ID:', farmerId)
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .insert({
        name,
        description,
        price,
        stock_level: stockLevel,
        farmer_id: farmerId,
        image_url: imageUrl,
        category,
        unit,
        is_organic: isOrganic
      })
      .select()
      .single()

    if (productError) {
      console.error('Product creation error:', productError)
      return new Response(
        JSON.stringify({ error: 'Failed to create product', details: productError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Product created successfully:', product)

    return new Response(
      JSON.stringify({ product }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating product:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
