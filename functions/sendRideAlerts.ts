import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sdk = base44.asServiceRole;
    
    // Get all favorites with notifications enabled
    const favorites = await sdk.entities.Favorite.filter({
      item_type: "ride"
    });
    
    const notificationsSent = [];
    const now = new Date();
    
    for (const fav of favorites) {
      // Skip if notifications not enabled
      if (!fav.notify_on_status_change && !fav.notify_on_wait_drop && !fav.notify_on_ride_reopen) continue;
      
      // Check cooldown (don't spam - wait at least 2 hours between notifications)
      if (fav.last_notified_at) {
        const lastNotified = new Date(fav.last_notified_at);
        const hoursSince = (now - lastNotified) / (1000 * 60 * 60);
        if (hoursSince < 2) continue;
      }
      
      // Get current ride status and history
      const rides = await sdk.entities.Ride.filter({ id: fav.item_id });
      if (rides.length === 0) continue;
      
      const ride = rides[0];
      let shouldNotify = false;
      let message = "";
      let alertType = "system";
      
      // Check if ride reopened (premium feature)
      if (fav.notify_on_ride_reopen && ride.is_open === true) {
        // Get recent history to check if ride was closed
        const history = await sdk.entities.WaitTimeHistory.filter({ ride_id: fav.item_id }, "-recorded_at", 10);
        const wasRecentlyClosed = history.some(h => h.ride_id === fav.item_id && h.recorded_at);
        if (wasRecentlyClosed) {
          shouldNotify = true;
          message = `🎉 ${ride.name} at ${ride.park_name} is back open!`;
          alertType = "ride_reopen";
        }
      }
      
      // Check if wait time dropped below threshold
      if (fav.notify_on_wait_drop && fav.wait_time_threshold && ride.is_open !== false) {
        const currentWait = ride.current_wait_minutes || ride.avg_wait_minutes || 999;
        if (currentWait <= fav.wait_time_threshold) {
          shouldNotify = true;
          message = `🎢 Great news! ${ride.name} at ${ride.park_name} has a wait time of just ${currentWait} minutes!`;
          alertType = "wait_drop";
        }
      }
      
      // Send notification
      if (shouldNotify && message) {
        try {
          const notifyMethods = fav.notify_methods || ["app", "email"];
          
          // Create in-app notification if enabled
          if (notifyMethods.includes("app")) {
            await sdk.entities.Notification.create({
              user_email: fav.user_email,
              title: `Wait Time Alert: ${ride.name}`,
              message: message,
              type: alertType,
              ride_id: ride.id,
              ride_name: ride.name,
              park_id: ride.park_id
            });
          }
          
          // Send email if enabled
          if (notifyMethods.includes("email")) {
            await sdk.integrations.Core.SendEmail({
              to: fav.user_email,
              subject: `Disney Wait Time Alert: ${ride.name}`,
              body: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: #6366f1;">${message}</h2>
                  <p>This is your automated alert from Enchanted Queues.</p>
                  <p><strong>Ride:</strong> ${ride.name}</p>
                  <p><strong>Park:</strong> ${ride.park_name}</p>
                  ${ride.is_open !== false ? `<p><strong>Current Wait:</strong> ${ride.current_wait_minutes || ride.avg_wait_minutes} minutes</p>` : ''}
                  <p style="margin-top: 20px; font-size: 12px; color: #666;">
                    To manage your alerts, visit the Enchanted Queues app.
                  </p>
                </div>
              `
            });
          }
          
          // Update last notified timestamp
          await sdk.entities.Favorite.update(fav.id, {
            last_notified_at: now.toISOString()
          });
          
          notificationsSent.push({
            user: fav.user_email,
            ride: ride.name,
            message
          });
        } catch (error) {
          console.error(`Failed to send notification to ${fav.user_email}:`, error);
        }
      }
    }
    
    return Response.json({
      success: true,
      notifications_sent: notificationsSent.length,
      details: notificationsSent,
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error("Error sending ride alerts:", error);
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});