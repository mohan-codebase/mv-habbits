const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const width = 1200;
const height = 750;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1117" />
      <stop offset="50%" stop-color="#151823" />
      <stop offset="100%" stop-color="#0d0f14" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e2230" />
      <stop offset="100%" stop-color="#181b26" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background App Window Frame -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="16" fill="url(#bgGrad)" stroke="#2a2e3f" stroke-width="1.5" />

  <!-- Top Window Header Bar -->
  <rect x="0" y="0" width="${width}" height="44" rx="16" fill="#161922" />
  <rect x="0" y="24" width="${width}" height="20" fill="#161922" />
  <line x1="0" y1="44" x2="${width}" y2="44" stroke="#25293a" stroke-width="1" />

  <!-- Window Dots -->
  <circle cx="24" cy="22" r="6" fill="#ef4444" opacity="0.85" />
  <circle cx="44" cy="22" r="6" fill="#f59e0b" opacity="0.85" />
  <circle cx="64" cy="22" r="6" fill="#10b981" opacity="0.85" />

  <text x="${width / 2}" y="27" fill="#6b7280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" text-anchor="middle">productivity-master.app/dashboard</text>

  <!-- Sidebar -->
  <rect x="0" y="44" width="240" height="${height - 44}" fill="#11131a" />
  <line x1="240" y1="44" x2="240" y2="${height}" stroke="#25293a" stroke-width="1" />

  <!-- App Logo & Title -->
  <rect x="24" y="68" width="32" height="32" rx="8" fill="url(#accentGrad)" />
  <path d="M 40 76 L 35 84 L 40 84 L 38 92 L 45 83 L 40 83 Z" fill="#ffffff" />
  <text x="66" y="89" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700">Productivity Master</text>

  <!-- Sidebar Links -->
  <rect x="16" y="128" width="208" height="36" rx="8" fill="#1f2333" />
  <text x="52" y="151" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">⚡ Dashboard</text>

  <text x="52" y="195" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500">📊 Analytics &amp; Heatmap</text>
  <text x="52" y="239" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500">🎯 Daily Habits</text>
  <text x="52" y="283" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500">🏆 18 Achievements</text>
  <text x="52" y="327" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500">⚙️ Settings &amp; Backup</text>

  <!-- Sidebar Bottom Pro / Coins Card -->
  <rect x="16" y="${height - 110}" width="208" height="84" rx="10" fill="#1a1d28" stroke="#2c3144" stroke-width="1" />
  <text x="32" y="${height - 82}" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">🪙 420 FOCUS COINS</text>
  <text x="32" y="${height - 62}" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">14-day streak bonus active</text>
  <rect x="32" y="${height - 48}" width="176" height="6" rx="3" fill="#2d3245" />
  <rect x="32" y="${height - 48}" width="124" height="6" rx="3" fill="#fbbf24" />

  <!-- Main Content Dashboard Area -->
  <text x="276" y="88" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">Today's Habits</text>
  <text x="276" y="112" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Saturday, Sept 5 • 4 of 5 completed (80%)</text>

  <!-- Top 3 Stat Cards -->
  <!-- Card 1 -->
  <rect x="276" y="132" width="280" height="84" rx="12" fill="url(#cardGrad)" stroke="#282d3e" stroke-width="1" />
  <text x="296" y="160" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">CURRENT STREAK</text>
  <text x="296" y="196" fill="#f97316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">🔥 14 Days</text>
  <text x="490" y="180" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">+100% week</text>

  <!-- Card 2 -->
  <rect x="580" y="132" width="280" height="84" rx="12" fill="url(#cardGrad)" stroke="#282d3e" stroke-width="1" />
  <text x="600" y="160" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">MONTHLY CONSISTENCY</text>
  <text x="600" y="196" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">92.4%</text>
  <text x="794" y="180" fill="#6366f1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">Top 5%</text>

  <!-- Card 3 -->
  <rect x="884" y="132" width="280" height="84" rx="12" fill="url(#cardGrad)" stroke="#282d3e" stroke-width="1" />
  <text x="904" y="160" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">ACHIEVEMENTS</text>
  <text x="904" y="196" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">12 / 18 🏆</text>
  <text x="1098" y="180" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">Gold Tier</text>

  <!-- Habit List Section -->
  <g transform="translate(276, 240)">
    <!-- Habit Item 1 -->
    <rect x="0" y="0" width="888" height="66" rx="10" fill="#191c27" stroke="#272c3d" stroke-width="1" />
    <circle cx="36" cy="33" r="16" fill="#10b981" />
    <path d="M 29 33 L 34 38 L 43 28" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <text x="68" y="32" fill="#f3f4f6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">🧘 Morning Meditation &amp; Breathwork</text>
    <text x="68" y="49" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5">Daily at 07:00 • Health &amp; Mindfulness</text>
    <rect x="730" y="21" width="70" height="24" rx="12" fill="#203a33" />
    <text x="765" y="37" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle">14d streak</text>
    <text x="840" y="38" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Done ✓</text>

    <!-- Habit Item 2 -->
    <rect x="0" y="78" width="888" height="66" rx="10" fill="#191c27" stroke="#272c3d" stroke-width="1" />
    <circle cx="36" cy="111" r="16" fill="#10b981" />
    <path d="M 29 111 L 34 116 L 43 106" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <text x="68" y="110" fill="#f3f4f6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">💧 Drink 2.5 Liters of Water</text>
    <text x="68" y="127" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5">Every 2 hours • Health &amp; Body</text>
    <rect x="730" y="99" width="70" height="24" rx="12" fill="#203a33" />
    <text x="765" y="115" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle">21d streak</text>
    <text x="840" y="116" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Done ✓</text>

    <!-- Habit Item 3 -->
    <rect x="0" y="156" width="888" height="66" rx="10" fill="#191c27" stroke="#272c3d" stroke-width="1" />
    <circle cx="36" cy="189" r="16" fill="#10b981" />
    <path d="M 29 189 L 34 194 L 43 184" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <text x="68" y="188" fill="#f3f4f6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">🏃 30 Min Outdoor Run / Cardio</text>
    <text x="68" y="205" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5">Mon, Wed, Fri, Sat • Fitness</text>
    <rect x="730" y="177" width="70" height="24" rx="12" fill="#203a33" />
    <text x="765" y="193" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle">7d streak</text>
    <text x="840" y="194" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Done ✓</text>

    <!-- Habit Item 4 -->
    <rect x="0" y="234" width="888" height="66" rx="10" fill="#191c27" stroke="#272c3d" stroke-width="1" />
    <circle cx="36" cy="267" r="16" fill="#10b981" />
    <path d="M 29 267 L 34 272 L 43 262" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <text x="68" y="266" fill="#f3f4f6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">📚 Read 20 Pages Non-Fiction</text>
    <text x="68" y="283" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5">Nightly at 21:30 • Personal Growth</text>
    <rect x="730" y="255" width="70" height="24" rx="12" fill="#203a33" />
    <text x="765" y="271" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle">18d streak</text>
    <text x="840" y="272" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Done ✓</text>

    <!-- Habit Item 5 -->
    <rect x="0" y="312" width="888" height="66" rx="10" fill="#191c27" stroke="#353b50" stroke-width="1.2" />
    <circle cx="36" cy="345" r="16" fill="#242839" stroke="#4b5563" stroke-width="1.5" />
    <text x="68" y="344" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">💻 90 Min Deep Focus Session</text>
    <text x="68" y="361" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5">Daily reminder at 16:00 • Career &amp; Craft</text>
    <rect x="730" y="333" width="70" height="24" rx="12" fill="#2d3347" />
    <text x="765" y="349" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" text-anchor="middle">11d streak</text>
    <rect x="824" y="328" width="50" height="34" rx="8" fill="#6366f1" />
    <text x="849" y="349" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" text-anchor="middle">Log</text>
  </g>

  <!-- Heatmap Mini Bar at Bottom -->
  <g transform="translate(276, 642)">
    <rect x="0" y="0" width="888" height="52" rx="10" fill="#141720" stroke="#25293a" stroke-width="1" />
    <text x="18" y="31" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600">30-DAY CONSISTENCY MAP</text>
    ${Array.from({ length: 30 }).map((_, i) => {
      const active = i !== 5 && i !== 19;
      const col = active ? (i % 3 === 0 ? '#10b981' : '#059669') : '#252a3a';
      return `<rect x="${240 + i * 21}" y="17" width="16" height="18" rx="3" fill="${col}" />`;
    }).join('')}
  </g>
</svg>
`;

async function main() {
  const outPath = path.join(__dirname, '..', 'public', 'marketing', 'hero-dashboard.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(outPath);
  console.log('Generated hero-dashboard.png successfully at:', outPath);
}

main().catch(console.error);
