const sharp = require("sharp");
const path = require("path");

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="65%" fx="50%" fy="45%">
      <stop offset="0%" stop-color="#131c31" />
      <stop offset="60%" stop-color="#0a0f1d" />
      <stop offset="100%" stop-color="#050811" />
    </radialGradient>
    <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="75%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Subtle border frame -->
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="none" stroke="#1e293b" stroke-width="2" opacity="0.6" />

  <!-- Centered Branding Block -->
  <g transform="translate(600, 270)">
    <!-- Top Row: Icon + Puls Wyborczy + .pl -->
    <!-- Centered cleanly -->
    <g transform="translate(-340, -70)">
      <!-- Icon emblem (original viewBox 0 0 32 32, scale 3.4) -->
      <g transform="scale(3.4)">
        <rect x="9" y="6" width="14" height="2" rx="1" fill="#475569" opacity="0.8" />
        <path
          d="M 3 18 L 8.5 18 L 11.5 10 L 15.5 25 L 19 13 L 21.5 20 L 23.5 18 L 29 18"
          stroke="url(#pulseGrad)"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="23" cy="7" r="1.75" fill="#10b981" />
      </g>

      <!-- Text "Puls Wyborczy" -->
      <text x="130" y="70" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="-1">
        Puls Wyborczy
      </text>

      <!-- Badge ".pl" -->
      <g transform="translate(615, 26)">
        <rect width="56" height="38" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2" />
        <text x="28" y="26" fill="#cbd5e1" font-family="monospace" font-size="20" font-weight="700" text-anchor="middle">.pl</text>
      </g>
    </g>

    <!-- Subtitle -->
    <text x="0" y="80" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="26" font-weight="500" text-anchor="middle" letter-spacing="0.2">
      Niezależne Prognozy i Sondaże Wyborcze
    </text>

    <!-- Model pill badge -->
    <g transform="translate(-180, 130)">
      <rect width="360" height="46" rx="23" fill="#0c1930" stroke="#1d4ed8" stroke-width="1.5" />
      <circle cx="32" cy="23" r="5" fill="#10b981" />
      <text x="195" y="29" fill="#93c5fd" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" text-anchor="middle" letter-spacing="0.5">
        Model: Google TimesFM 3.0
      </text>
    </g>
  </g>

  <!-- Bottom link -->
  <text x="600" y="555" fill="#475569" font-family="monospace" font-size="16" font-weight="600" text-anchor="middle" letter-spacing="2">
    PULSWYBORCZY.PL
  </text>
</svg>`;

const outputPath = path.join(__dirname, "../public/og-image.png");

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(outputPath)
  .then((info) => {
    console.log("Generated og-image.png successfully:", info);
  })
  .catch((err) => {
    console.error("Error generating og-image.png:", err);
    process.exit(1);
  });
