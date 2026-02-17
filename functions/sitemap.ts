import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all parks and rides with service role
    const parks = await base44.asServiceRole.entities.Park.list();
    console.log('Parks fetched:', parks.length);
    const visibleParks = parks.filter(p => !p.is_hidden);
    console.log('Visible parks:', visibleParks.length);
    
    const rides = await base44.asServiceRole.entities.Ride.list();
    console.log('Rides fetched:', rides.length);
    const visibleRides = rides.filter(r => !r.is_hidden && r.type !== 'show');
    console.log('Visible rides:', visibleRides.length);
    
    // Use enchanted-queues.com domain
    const baseUrl = 'https://enchanted-queues.com';
    const today = '2026-02-09';
    
    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/about-us', priority: '0.8', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
      { url: '/terms-of-service', priority: '0.5', changefreq: 'monthly' },
      { url: '/disclaimer', priority: '0.5', changefreq: 'monthly' },
      { url: '/premium', priority: '0.7', changefreq: 'weekly' },
      { url: '/success', priority: '0.6', changefreq: 'monthly' },
      { url: '/profile', priority: '0.6', changefreq: 'weekly' },
      { url: '/personalization', priority: '0.6', changefreq: 'monthly' },
      { url: '/my-enchanted-queues', priority: '0.7', changefreq: 'daily' },
      { url: '/billing', priority: '0.5', changefreq: 'monthly' },
    ];
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add static pages
    for (const page of staticPages) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += '  </url>\n';
    }
    
    // Add parks
    for (const park of visibleParks) {
      if (park.slug) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/parks/${park.slug}</loc>\n`;
        sitemap += `    <lastmod>${today}</lastmod>\n`;
        sitemap += '    <changefreq>daily</changefreq>\n';
        sitemap += '    <priority>0.9</priority>\n';
        sitemap += '  </url>\n';
      }
    }
    
    // Add rides
    for (const ride of visibleRides) {
      if (ride.id) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/ride/${ride.id}</loc>\n`;
        sitemap += `    <lastmod>${today}</lastmod>\n`;
        sitemap += '    <changefreq>daily</changefreq>\n';
        sitemap += '    <priority>0.7</priority>\n';
        sitemap += '  </url>\n';
      }
    }
    
    sitemap += '</urlset>';
    
    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
});