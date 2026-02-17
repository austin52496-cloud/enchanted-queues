import React, { useEffect } from "react";

export default function AdPlacement({ isPremium }) {
  useEffect(() => {
    if (isPremium) return; // Don't show ads for premium users

    // Push the ad
    if (window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-8118272020087343"
      data-ad-slot="7308107660"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}