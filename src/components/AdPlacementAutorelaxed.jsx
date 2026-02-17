import React, { useEffect } from "react";

export default function AdPlacementAutorelaxed({ isPremium }) {
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
      data-ad-format="autorelaxed"
      data-ad-client="ca-pub-8118272020087343"
      data-ad-slot="3032250499"
    />
  );
}