import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { rideId } = await req.json();

    // Get ride details with current wait
    const { data: ride } = await supabaseClient
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (!ride) {
      throw new Error('Ride not found');
    }

    // Get recent history for this ride (last 2 hours)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { data: recentHistory } = await supabaseClient
      .from('wait_time_history')
      .select('*')
      .eq('ride_id', rideId)
      .gte('recorded_at', twoHoursAgo.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(24); // Last 2 hours at 5-min intervals

    // Get all rides at this park for comparison
    const { data: parkRides } = await supabaseClient
      .from('rides')
      .select('*')
      .eq('park_id', ride.park_id)
      .eq('is_open', true)
      .neq('id', rideId);

    // Generate AI tip based on current conditions
    const tip = generateDynamicTip(ride, recentHistory || [], parkRides || []);

    return new Response(
      JSON.stringify({
        success: true,
        tip: tip,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Tip generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        tip: 'Check back soon for personalized tips!',
        error: error.message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateDynamicTip(ride: any, recentHistory: any[], parkRides: any[]): string {
  const currentWait = ride.current_wait_minutes || 0;
  const currentHour = new Date().getHours();
  
  // Calculate trend (increasing/decreasing)
  let trend = 'stable';
  if (recentHistory.length >= 2) {
    const latest = recentHistory[0].wait_minutes;
    const earlier = recentHistory[recentHistory.length - 1].wait_minutes;
    if (latest > earlier + 10) trend = 'increasing';
    if (latest < earlier - 10) trend = 'decreasing';
  }

  // Find similar rides with shorter waits
  const shorterWaitRides = parkRides
    .filter(r => r.type === ride.type && r.current_wait_minutes < currentWait - 10)
    .sort((a, b) => (a.current_wait_minutes || 0) - (b.current_wait_minutes || 0))
    .slice(0, 2);

  // Time-based tips
  const timeOfDay = currentHour < 11 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  // Generate tip based on conditions
  const tips = [];

  // Trend-based tips
  if (trend === 'increasing' && currentWait > 40) {
    tips.push(`⬆️ Wait times are climbing fast! Current wait: ${currentWait} min. Consider coming back later.`);
  } else if (trend === 'decreasing' && currentWait > 20) {
    tips.push(`⬇️ Good news! Wait times are dropping. Now at ${currentWait} min and improving.`);
  } else if (currentWait < 20) {
    tips.push(`🎉 Great time to ride! Only ${currentWait} min wait right now.`);
  }

  // Lightning Lane tip
  if (ride.has_lightning_lane && currentWait > 60) {
    tips.push(`⚡ Consider using Lightning Lane - standby is currently ${currentWait} min.`);
  }

  // Alternative ride tips
  if (shorterWaitRides.length > 0 && currentWait > 45) {
    const altRide = shorterWaitRides[0];
    tips.push(`💡 Try ${altRide.name} instead - only ${altRide.current_wait_minutes} min wait!`);
  }

  // Time of day tips
  if (timeOfDay === 'morning' && currentWait > 30) {
    tips.push(`🌅 Rope drop crowds are here. Wait times typically drop after 11 AM.`);
  } else if (timeOfDay === 'afternoon' && currentWait < 30) {
    tips.push(`☀️ Perfect timing! Afternoon waits are lower as crowds spread out.`);
  } else if (timeOfDay === 'evening' && currentWait > 45) {
    tips.push(`🌙 Evening rush. If you can, come back 30 minutes before park close.`);
  }

  // Peak wait warning
  if (currentWait >= (ride.peak_wait_minutes || 90) * 0.9) {
    tips.push(`🔥 Near peak wait! This ride typically maxes out around ${ride.peak_wait_minutes} min.`);
  }

  // Pro tips for specific rides
  if (ride.name.includes('Flight of Passage') && currentWait > 90) {
    tips.push(`🦋 Pro tip: This ride is always busy. Best times are 8-9 AM or last hour before close.`);
  } else if (ride.name.includes('Seven Dwarfs') && currentWait > 60) {
    tips.push(`⛏️ Pro tip: Use Individual Lightning Lane or visit during parades/fireworks.`);
  } else if (ride.name.includes('TRON') && currentWait > 50) {
    tips.push(`🏍️ Pro tip: Virtual queue opens at 7 AM & 1 PM. Standby waits stay high all day.`);
  }

  // Return the most relevant tip
  return tips[0] || `Current wait: ${currentWait} min. ${
    currentWait < 30 ? 'Great time to ride!' : 
    currentWait < 60 ? 'Moderate wait - worth it!' :
    'Consider coming back later.'
  }`;
}