import { useEffect } from "react";

export default function SitemapXml() {
  useEffect(() => {
    // Get the function URL and redirect to it
    const functionUrl = `${window.location.origin}/functions/sitemap`;
    window.location.href = functionUrl;
  }, []);

  return null;
}