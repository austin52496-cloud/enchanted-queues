import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Theme Parks Wiki entity IDs for Disney World
const PARK_IDS = {
  'Magic Kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
  'EPCOT': '47f90d2c-e191-4239-a466-5892ef59a88b',
  'Hollywood Studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  'Animal Kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[PARK HOURS] Starting fetch from themeparks.wiki API');

    // Fetch all Disney World parks
    const parks = await base44.asServiceRole.entities.Park.list();
    const disneyParks = parks.filter(p => 
      p.name.includes('Magic Kingdom') || 
      p.name.includes('EPCOT') || 
      p.name.includes('Hollywood Studios') || 
      p.name.includes('Animal Kingdom')
    );

    console.log(`[PARK HOURS] Found ${disneyParks.length} Disney parks to update`);

    let totalUpdated = 0;
    let totalCreated = 0;

    for (const park of disneyParks) {
      try {
        const wikiId = PARK_IDS[park.name];
        if (!wikiId) {
          console.warn(`[PARK HOURS] No wiki ID found for ${park.name}`);
          continue;
        }

        console.log(`[PARK HOURS] Fetching schedule for ${park.name} from themeparks.wiki`);

        // Fetch schedule from themeparks.wiki API
        const scheduleResponse = await fetch(
          `https://api.themeparks.wiki/v1/entity/${wikiId}/schedule`
        );
        
        if (!scheduleResponse.ok) {
          console.error(`[PARK HOURS] Failed to fetch schedule for ${park.name}`);
          continue;
        }

        const scheduleData = await scheduleResponse.json();
        const entries = scheduleData.schedule || [];

        console.log(`[PARK HOURS] Received ${entries.length} schedule entries for ${park.name}`);

        // Log first 5 entries for debugging
        console.log(`[PARK HOURS] Sample entries for ${park.name}:`, JSON.stringify(entries.slice(0, 5), null, 2));

        // Group entries by date and type
        const dateMap = {};
        for (const entry of entries) {
          // Parse the date and add 1 day to correct the API's date offset
          const dateObj = new Date(entry.date + 'T00:00:00Z');
          dateObj.setUTCDate(dateObj.getUTCDate() + 1);
          const date = dateObj.toISOString().split('T')[0];
          if (!dateMap[date]) {
            dateMap[date] = { ticketed_events: [] };
          }
          if (entry.type === 'TICKETED_EVENT') {
            dateMap[date].ticketed_events.push(entry);
          } else {
            dateMap[date][entry.type] = entry;
          }
        }

        // Process consolidated hours per date
        for (const [date, entries] of Object.entries(dateMap)) {
          console.log(`[PARK HOURS] Processing date: ${date}, entries:`, Object.keys(entries));
          const operating = entries['OPERATING'];
          
          // Find early entry and extended hours from ticketed events
          let earlyEntry = null;
          let extendedEntry = null;
          
          for (const ticketed of entries.ticketed_events) {
            if (ticketed.description === 'Early Entry') {
              earlyEntry = ticketed;
            } else if (ticketed.description && 
              (ticketed.description.includes('Extended') || 
               ticketed.description.includes('Late') ||
               ticketed.description.includes('Evening'))) {
              // Check if this event is after the park's closing time
              const ticketedClose = new Date(ticketed.closingTime);
              const parkClose = new Date(operating.closingTime);
              if (ticketedClose > parkClose) {
                extendedEntry = ticketed;
              }
            }
          }

          if (!operating) continue;

          const hoursRecord = {
            park_id: park.id,
            park_name: park.name,
            date: date,
            open_time: operating.openingTime ? convertTo12Hour(operating.openingTime) : null,
            close_time: operating.closingTime ? convertTo12Hour(operating.closingTime) : null,
            early_entry_time: earlyEntry ? convertTo12Hour(earlyEntry.openingTime) : null,
            extended_hours_close: extendedEntry ? convertTo12Hour(extendedEntry.closingTime) : null,
            is_closed: false,
            special_hours: null
          };

          const existingHours = await base44.asServiceRole.entities.ParkHours.filter({
            park_id: park.id,
            date: date
          });

          if (existingHours.length > 0) {
            const existing = existingHours[0];
            if (
              existing.open_time !== hoursRecord.open_time ||
              existing.close_time !== hoursRecord.close_time ||
              existing.early_entry_time !== hoursRecord.early_entry_time ||
              existing.extended_hours_close !== hoursRecord.extended_hours_close
            ) {
              await base44.asServiceRole.entities.ParkHours.update(existing.id, hoursRecord);
              totalUpdated++;
              console.log(`[PARK HOURS] Updated ${park.name} for ${date}`);
            }
          } else {
            await base44.asServiceRole.entities.ParkHours.create(hoursRecord);
            totalCreated++;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[PARK HOURS] Error fetching hours for ${park.name}:`, error.message);
      }
    }

    console.log(`[PARK HOURS] Completed: ${totalCreated} created, ${totalUpdated} updated`);

    return Response.json({
      success: true,
      parks_processed: disneyParks.length,
      hours_created: totalCreated,
      hours_updated: totalUpdated
    });

  } catch (error) {
    console.error('[PARK HOURS] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

function convertTo12Hour(isoTime) {
  if (!isoTime) return null;
  // Parse ISO 8601 format: "2026-02-07T07:30:00-05:00"
  // The time is already in EST, but JavaScript's Date parsing converts to local timezone
  // We need to extract just the local time from the ISO string
  const timePart = isoTime.split('T')[1]; // "07:30:00-05:00"
  const time = timePart.split(/[+-]/)[0]; // "07:30:00"
  const [hours, minutes] = time.split(':').map(Number);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}