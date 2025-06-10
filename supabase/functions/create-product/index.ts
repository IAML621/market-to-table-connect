
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

    const { name, description, price, stockLevel, imageUrl, category, unit, isOrganic } = await req.json()

    // Get farmer record for the authenticated user (with user data copied)
    const { data: farmer, error: farmerError } = await supabaseClient
      .from('farmers')
      .select('id, user_id, username, email, farm_name, farm_location')
      .eq('user_id', user.id)
      .single()

    if (farmerError || !farmer) {
      console.error('Farmer not found:', farmerError)
      console.log('Creating farmer record for user:', user.id)
      
      // Use the database function to create farmer with user data
      const { data: farmerId, error: createError } = await supabaseClient.rpc('create_farmer_with_user_data', {
        p_user_id: user.id,
        p_farm_name: null,
        p_farm_location: null
      })

      if (createError || !farmerId) {
        console.error('Failed to create farmer record:', createError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create farmer profile', 
            details: createError?.message 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Created new farmer record with ID:', farmerId)

      // Create the product with the new farmer ID
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .insert({
          name,
          description,
          price: parseFloat(price),
          stock_level: parseInt(stockLevel),
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

      return new Response(
        JSON.stringify({ product }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Found existing farmer:', farmer)

    // Create the product with the existing farmer
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .insert({
        name,
        description,
        price: parseFloat(price),
        stock_level: parseInt(stockLevel),
        farmer_id: farmer.id,
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
