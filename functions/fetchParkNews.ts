import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch active news sources from database
    const sources = await base44.asServiceRole.entities.NewsSource.filter({ is_active: true });
    
    const feeds = sources.length > 0 ? sources.map(s => ({
      url: s.rss_url,
      source: s.name,
      max: s.max_articles || 5
    })) : [
      { url: 'https://disneyparks.disney.go.com/blog/feed/', source: 'Disney Parks Blog', max: 5 },
      { url: 'https://wdwnt.com/feed/', source: 'WDWNT', max: 5 }
    ];

    const articles = [];

    // Fetch all feeds in parallel with timeout
    const feedPromises = feeds.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout per feed
        
        const response = await fetch(feed.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const text = await response.text();
        
        // Parse RSS feed
        const itemRegex = /<item>(.*?)<\/item>/gs;
        const items = [...text.matchAll(itemRegex)];
        
        const feedArticles = [];
        for (const item of items.slice(0, feed.max || 5)) {
          const content = item[1];
          
          // Extract title - handle CDATA
          let title = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] || 
                     content.match(/<title>(.*?)<\/title>/s)?.[1] || '';
          
          // Decode all HTML entities
          const decodeEntities = (str) => {
            return str
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&#8217;/g, "'")
              .replace(/&#8216;/g, "'")
              .replace(/&#8211;/g, '–')
              .replace(/&#8212;/g, '—')
              .replace(/&#8220;/g, '"')
              .replace(/&#8221;/g, '"')
              .replace(/&#8230;/g, '…')
              .replace(/&nbsp;/g, ' ')
              .replace(/&rsquo;/g, "'")
              .replace(/&lsquo;/g, "'")
              .replace(/&rdquo;/g, '"')
              .replace(/&ldquo;/g, '"')
              .replace(/&mdash;/g, '—')
              .replace(/&ndash;/g, '–')
              .replace(/&hellip;/g, '…');
          };
          
          title = decodeEntities(title);
          
          const link = content.match(/<link>(.*?)<\/link>/s)?.[1] || '';
          const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';
          
          // Extract description - try content:encoded first, then description
          let description = content.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/s)?.[1] ||
                          content.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s)?.[1] || 
                          content.match(/<description>(.*?)<\/description>/s)?.[1] || '';
          
          // Aggressively strip all HTML - multiple passes to handle nested tags
          let prevLength = 0;
          while (description.length !== prevLength && description.includes('<')) {
            prevLength = description.length;
            description = description.replace(/<[^>]*>/g, ' ');
          }
          
          // Clean up whitespace and decode entities
          description = description.replace(/\s+/g, ' ').trim();
          description = decodeEntities(description);
          
          // If still empty or too short, skip this article
          if (!description || description.length < 10) {
            description = 'Click to read more...';
          }
          
          // Truncate to 150 chars
          if (description.length > 150) {
            description = description.substring(0, 150) + '...';
          }
          
          if (title && link) {
            feedArticles.push({
              title: title.trim(),
              link: link.trim(),
              date: pubDate.trim(),
              excerpt: description,
              source: feed.source
            });
          }
        }
        return feedArticles;
      } catch (feedError) {
        console.error(`Error fetching ${feed.source}:`, feedError);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    results.forEach(feedArticles => articles.push(...feedArticles));

    // Sort by date (newest first)
    articles.sort((a, b) => {
      try {
        return new Date(b.date) - new Date(a.date);
      } catch {
        return 0;
      }
    });

    return Response.json({ 
      success: true,
      articles: articles.slice(0, 10)
    });
  } catch (error) {
    console.error('Error in fetchParkNews:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      articles: []
    }, { status: 500 });
  }
});