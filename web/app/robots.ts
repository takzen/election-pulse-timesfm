import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/polityka-prywatnosci"],
      },
    ],
    sitemap: "https://pulswyborczy.pl/sitemap.xml",
  };
}
