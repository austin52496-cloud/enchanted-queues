import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to convert 12-hour time to 24-hour format
function convertTo24Hour(time12h) {
  if (!time12h) return "23:59:00";
  
  const [time, modifier] = time12h.split(' ');
  if (!time) return "23:59:00";
  
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM' && hours !== '00') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

Deno.serve(async (req) => {
  try {
    console.log('[SYNC] Starting wait time sync');
    
    const base44 = createClientFromRequest(req);
    const sdk = base44.asServiceRole;
    
    console.log('[SYNC] Proceeding with sync');
    
    // Fetch parks data from Queue-Times API with retry
    let queueTimesData = null;
    let retries = 3;
    
    while (retries > 0 && !queueTimesData) {
      try {
        const response = await fetch("https://queue-times.com/parks.json");
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        queueTimesData = await response.json();
        console.log('[SYNC] Queue-Times data fetched successfully');
      } catch (error) {
        retries--;
        if (retries > 0) {
          const delay = (4 - retries) * 1000; // 1s, 2s, 3s
          console.log(`[SYNC] Retry ${4 - retries}/3, waiting ${delay}ms`);
          await sleep(delay);
        } else {
          console.error('[SYNC] Failed to fetch Queue-Times data:', error.message);
          return Response.json({ 
            success: false, 
            error: 'Failed to fetch queue data after retries',
            details: error.message
          });
        }
      }
    }
    
    if (!queueTimesData) {
      return Response.json({ 
        success: false, 
        error: 'No data from Queue-Times API'
      });
    }
    
    // Find Disney parks
    const disneyCompany = queueTimesData.find((company) => 
      company.name?.toLowerCase().includes("disney")
    );
    
    if (!disneyCompany || !disneyCompany.parks) {
      console.log('[SYNC] Disney parks not found');
      return Response.json({ 
        success: false, 
        error: "Disney parks not found"
      });
    }
    
    const allDbParks = await sdk.entities.Park.list();
    let updatedCount = 0;
    let errorCount = 0;
    
    // Pre-load all rides to avoid individual queries
    const allDbRides = await sdk.entities.Ride.list();
    
    // Process each Disney park from Queue-Times
    for (const apiPark of disneyCompany.parks) {
      try {
        console.log(`[SYNC] Fetching park ${apiPark.name}`);
        
        // Fetch detailed park data
        const parkResponse = await fetch(`https://queue-times.com/parks/${apiPark.id}/queue_times.json`);
        
        if (!parkResponse.ok) {
          console.warn(`[SYNC] Park ${apiPark.name}: ${parkResponse.status}`);
          errorCount++;
          continue;
        }
        
        const parkData = await parkResponse.json();
        
        // Find matching park in our database
        let ourPark = allDbParks.find(p => {
          const pName = p.name.toLowerCase().replace(/\s+/g, '');
          const apiName = apiPark.name.toLowerCase().replace(/\s+/g, '');
          
          // Direct match
          if (pName === apiName) return true;
          
          // Partial matches for common variations
          if (pName.includes('magickingdom') && apiName.includes('magic')) return true;
          if (pName.includes('hollywood') && apiName.includes('hollywood')) return true;
          if (pName.includes('epcot') && apiName.includes('epcot')) return true;
          if (pName.includes('animalkingdom') && apiName.includes('animal')) return true;
          if (pName.includes('disneyland') && apiName.includes('disneyland') && !apiName.includes('adventure')) return true;
          if (pName.includes('california') && apiName.includes('california')) return true;
          
          return false;
        });
        
        if (!ourPark) {
          console.log(`[SYNC] No mapping for ${apiPark.name}`);
          continue;
        }
        
        console.log(`[SYNC] Processing ${ourPark.name}`);
        
        // Process rides from this park
        if (!parkData.lands || !Array.isArray(parkData.lands)) {
          console.log(`[SYNC] No lands data for ${ourPark.name}`);
          continue;
        }
        
        const ridesToCreate = [];
        const rideUpdatePromises = [];
        
        for (const land of parkData.lands) {
          if (!land.rides || !Array.isArray(land.rides)) continue;
          
          for (const apiRide of land.rides) {
            // Find matching ride in our database
            const ourRide = allDbRides.find(r => r.park_id === ourPark.id && r.name === apiRide.name);

            if (!ourRide) continue;

            // Debug Spaceship Earth
            if (apiRide.name === 'Spaceship Earth') {
              console.log(`[SYNC] Spaceship Earth: wait=${apiRide.wait_time}, is_open=${apiRide.is_open}`);
            }
            
            const waitTime = apiRide.wait_time !== null && apiRide.wait_time !== undefined ? apiRide.wait_time : 0;
            // Default to open unless API explicitly says closed
            const isOpen = apiRide.is_open !== false;
            
            // Queue ride update for parallel execution
            rideUpdatePromises.push(
              sdk.entities.Ride.update(ourRide.id, {
                current_wait_minutes: isOpen ? waitTime : 0,
                is_open: isOpen,
                last_updated: new Date().toISOString()
              }).catch(err => {
                console.error(`[SYNC] Ride ${apiRide.name}:`, err.message);
              })
            );
            
            // Record history if open (even if wait is 0)
            if (isOpen && apiRide.wait_time !== null && apiRide.wait_time !== undefined) {
              ridesToCreate.push({
                ride_id: ourRide.id,
                ride_name: ourRide.name,
                park_id: ourPark.id,
                wait_minutes: Math.max(0, waitTime),
                recorded_at: new Date().toISOString(),
                hour_of_day: new Date().getHours(),
                day_of_week: new Date().getDay()
              });
            }
            
            updatedCount++;
          }
        }
        
        // Execute all ride updates in parallel
        if (rideUpdatePromises.length > 0) {
          await Promise.all(rideUpdatePromises);
        }
        
        // Batch create history records
        if (ridesToCreate.length > 0) {
          await sdk.entities.WaitTimeHistory.bulkCreate(ridesToCreate);
        }
      } catch (parkError) {
        console.error(`[SYNC] Park processing error for ${apiPark.name}:`, parkError.message);
        errorCount++;
      }
    }
    
    console.log(`[SYNC] Complete: ${updatedCount} updated, ${errorCount} errors`);
    
    return Response.json({
      success: true,
      updated: updatedCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[SYNC] Fatal error:', error.message);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});