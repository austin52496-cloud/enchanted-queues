import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper function to convert 12-hour time to 24-hour format
function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[PARK STATUS] Starting park status check');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Get current EST time
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const currentHour = estTime.getHours();
    const currentMinute = estTime.getMinutes();

    // Get all parks
    const parks = await base44.asServiceRole.entities.Park.list();
    console.log(`[PARK STATUS] Checking ${parks.length} parks at ${currentHour}:${currentMinute.toString().padStart(2, '0')} EST`);

    let parksUpdated = 0;
    let ridesUpdated = 0;

    for (const park of parks) {
      // Check if park has hours for today
      const todayHours = await base44.asServiceRole.entities.ParkHours.filter({
        park_id: park.id,
        date: todayStr
      });

      // Determine if park should be closed
      let shouldClosePark = false;
      
      if (todayHours.length === 0) {
        // No hours data = closed
        shouldClosePark = true;
        console.log(`[PARK STATUS] ${park.name}: No hours data, marking as closed`);
      } else if (todayHours[0].is_closed === true) {
        // Explicitly marked closed
        shouldClosePark = true;
        console.log(`[PARK STATUS] ${park.name}: Marked as closed`);
      } else if (todayHours[0].close_time && todayHours[0].open_time) {
        // Parse opening and closing times
        const closeTime24 = convertTo24Hour(todayHours[0].close_time);
        const openTime24 = convertTo24Hour(todayHours[0].open_time);
        
        const [closeHour, closeMin] = closeTime24.split(':').map(Number);
        const [openHour, openMin] = openTime24.split(':').map(Number);
        
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const closeTotalMinutes = closeHour * 60 + closeMin;
        const openTotalMinutes = openHour * 60 + openMin;
        
        // Park is closed if:
        // 1. Before opening time
        // 2. After closing time
        if (currentTotalMinutes < openTotalMinutes || currentTotalMinutes >= closeTotalMinutes) {
          shouldClosePark = true;
          console.log(`[PARK STATUS] ${park.name}: Outside operating hours (${todayHours[0].open_time} - ${todayHours[0].close_time}), marking as closed`);
        } else {
          console.log(`[PARK STATUS] ${park.name}: OPEN (closes at ${todayHours[0].close_time})`);
        }
      } else {
        console.log(`[PARK STATUS] ${park.name}: OPEN (no closing time specified)`);
      }
      
      if (shouldClosePark) {
        const rides = await base44.asServiceRole.entities.Ride.filter({ park_id: park.id });
        
        for (const ride of rides) {
          if (ride.is_open !== false || ride.current_wait_minutes !== 0) {
            await base44.asServiceRole.entities.Ride.update(ride.id, {
              is_open: false,
              current_wait_minutes: 0
            });
            ridesUpdated++;
          }
        }
        
        console.log(`[PARK STATUS] Marked ${rides.length} rides as closed for ${park.name}`);
      }
      
      parksUpdated++;
    }

    console.log(`[PARK STATUS] Updated ${parksUpdated} parks, ${ridesUpdated} rides`);

    return Response.json({
      success: true,
      parks_checked: parks.length,
      parks_updated: parksUpdated,
      rides_updated: ridesUpdated
    });

  } catch (error) {
    console.error('[PARK STATUS] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});