import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function SitemapXml() {
  useEffect(() => {
    const fetchAndRenderSitemap = async () => {
      try {
        const response = await base44.functions.invoke('sitemap', {});
        const xml = response.data;
        
        // Replace document content with XML
        document.open('text/xml');
        document.write(xml);
        document.close();
      } catch (error) {
        console.error('Sitemap error:', error);
        document.open('text/xml');
        document.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
        document.close();
      }
    };
    
    fetchAndRenderSitemap();
  }, []);

  return null;
}