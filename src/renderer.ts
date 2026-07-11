import { AlchemyData, LabAsset, FamiliarData, SparkleData } from './alchemy';

const W = 900;
const H = 260;

export function renderSVG(al: AlchemyData, username: string): string {
  // Distribute assets across 3 shelves:
  // - Top Shelf (y = 80)
  // - Middle Shelf (y = 145)
  // - Countertop (y = 210)
  const topShelfAssets   = al.assets.slice(0, 17);
  const midShelfAssets   = al.assets.slice(17, 34);
  const counterAssets    = al.assets.slice(34, 52);

  return `<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
     style="border-radius:12px;overflow:hidden;background:${al.wallColor}">
  <defs>
    <!-- Shading & Glows -->
    <filter id="magic-glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <linearGradient id="crystal-shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="${al.magicEnergyColor}"/>
      <stop offset="100%" stop-color="#2c1a3b"/>
    </linearGradient>

    <!-- Stonework Masonry Pattern -->
    <pattern id="masonry" width="120" height="60" patternUnits="userSpaceOnUse">
      <path d="M 0,30 L 120,30 M 60,0 L 60,30 M 120,30 L 120,60 M 0,30 L 0,60 M 30,30 L 30,60 M 90,30 L 90,60" 
        fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="2"/>
    </pattern>
  </defs>

  <!-- Brick Wall Texture -->
  <rect width="${W}" height="${H}" fill="url(#masonry)"/>

  <!-- Shelf Back Shading -->
  <rect x="20" y="72" width="860" height="8" fill="rgba(0,0,0,0.3)"/>
  <rect x="20" y="137" width="860" height="8" fill="rgba(0,0,0,0.3)"/>
  <rect x="20" y="202" width="860" height="8" fill="rgba(0,0,0,0.3)"/>

  <!-- Shelves -->
  <rect class="shelf" x="20" y="80" width="860" height="6" fill="${al.shelfColor}" rx="1"/>
  <rect class="shelf" x="20" y="145" width="860" height="6" fill="${al.shelfColor}" rx="1"/>
  <rect class="counter" x="20" y="210" width="860" height="12" fill="${al.shelfColor}" rx="2"/>

  <!-- Lab Assets on Shelves -->
  ${renderShelfAssets(topShelfAssets, 80, 50)}
  ${renderShelfAssets(midShelfAssets, 145, 50)}
  ${renderShelfAssets(counterAssets, 210, 47)}

  <!-- Summoned Familiars -->
  ${al.familiars.map(f => renderFamiliar(f)).join('\n  ')}

  <!-- Floating Mana Crystal in Center -->
  ${renderManaCrystal(al)}

  <!-- Floating Sparkles (Mana Energy Particles) -->
  ${al.sparkles.map(s => renderSparkle(s, al)).join('\n  ')}

  <!-- Glitching smoke if open issues are high -->
  ${al.hasSmokePollution ? renderSmoke(al) : ''}

  <!-- HUD Overlay -->
  ${renderHUD(al, username)}

  <style>${renderCSS(al)}</style>
</svg>`;
}

// ─── Render Assets on a single shelf ────────────────────────
function renderShelfAssets(assets: LabAsset[], shelfY: number, spacing: number): string {
  return assets.map((asset, i) => {
    if (asset.assetType === 'empty') return '';
    const x = 50 + i * spacing;
    const h = asset.height;
    const col = asset.color;
    
    // Components sit directly on top of the shelf
    const y = shelfY - 1;

    let draw = '';
    switch (asset.assetType) {
      case 'vial':
        // Slender cylinder
        draw = `
          <line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>
          <circle cx="${x}" cy="${y - h}" r="2.5" fill="#ffffff" opacity="0.7"/>
        `;
        break;

      case 'flask':
        // Rounded bottom boiling flask
        draw = `
          <!-- Neck -->
          <line x1="${x}" y1="${y - h*0.4}" x2="${x}" y2="${y - h}" stroke="#fff" stroke-width="2" opacity="0.6"/>
          <!-- Body -->
          <circle cx="${x}" cy="${y - h*0.4}" r="${h*0.4}" fill="${col}"/>
          <circle cx="${x}" cy="${y - h*0.4}" r="${h*0.4}" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
          <!-- Bubbles inside boiling flask -->
          ${asset.isBoiling ? `<circle class="flask-bubble" cx="${x - 2}" cy="${y - h*0.4 + 2}" r="1" fill="#fff"/>
                               <circle class="flask-bubble" cx="${x + 2}" cy="${y - h*0.4 - 1}" r="0.8" fill="#fff" style="animation-delay:0.4s"/>` : ''}
        `;
        break;

      case 'alembic':
        // Alembic retort (boiler with condensing tube)
        draw = `
          <!-- Retort body -->
          <path d="M ${x - h*0.4},${y} C ${x - h*0.4},${y - h} ${x + h*0.4},${y - h} ${x + h*0.4},${y} Z" fill="${col}"/>
          <!-- Condensing tube -->
          <path d="M ${x + h*0.2},${y - h*0.7} Q ${x + h*0.6},${y - h*0.5} ${x + h*0.5},${y}" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7"/>
          <rect x="${x - 1}" y="${y - h*0.85}" width="2" height="${h*0.15}" fill="#fff"/>
        `;
        break;

      case 'spellbook':
        // Standing thick ancient book
        draw = `
          <!-- Cover -->
          <rect x="${x - 5}" y="${y - h}" width="10" height="${h}" fill="#5a2d0c" rx="1"/>
          <!-- Gold spine bands -->
          <line x1="${x - 5}" y1="${y - h*0.8}" x2="${x + 5}" y2="${y - h*0.8}" stroke="${col}" stroke-width="1.5"/>
          <line x1="${x - 5}" y1="${y - h*0.2}" x2="${x + 5}" y2="${y - h*0.2}" stroke="${col}" stroke-width="1.5"/>
          <!-- Page edges showing -->
          <rect x="${x + 3}" y="${y - h + 1}" width="1.5" height="${h - 2}" fill="#fdfefe"/>
        `;
        break;
    }

    return `<g class="lab-asset" style="animation-delay:${(i * 0.12).toFixed(2)}s">${draw}</g>`;
  }).join('\n  ');
}

// ─── Familiar Renderer ──────────────────────────────────────
function renderFamiliar(fam: FamiliarData): string {
  const x = fam.x;
  const y = fam.y;

  switch (fam.type) {
    case 'cat':
      // Black cat sitting with glowing blinking eyes
      return `
        <g transform="translate(${x}, ${y}) scale(${fam.scale})" class="familiar-cat">
          <!-- Body -->
          <ellipse cx="0" cy="-6" rx="6" ry="8" fill="#1e272e"/>
          <!-- Head -->
          <circle cx="0" cy="-14" r="5" fill="#1e272e"/>
          <!-- Ears -->
          <polygon points="-4,-17 -4,-22 -1,-18" fill="#1e272e"/>
          <polygon points="4,-17 4,-22 1,-18" fill="#1e272e"/>
          <!-- Tail -->
          <path d="M -5,-3 C -10,-3 -12,-8 -10,-12" fill="none" stroke="#1e272e" stroke-width="2" stroke-linecap="round"/>
          <!-- Glowing Eyes -->
          <circle class="blinking-eye" cx="-1.8" cy="-14" r="0.8" fill="#f1c40f"/>
          <circle class="blinking-eye" cx="1.8" cy="-14" r="0.8" fill="#f1c40f"/>
        </g>
      `;

    case 'owl':
      // Wizard owl perched
      return `
        <g transform="translate(${x}, ${y}) scale(${fam.scale})" class="familiar-owl">
          <!-- Body -->
          <ellipse cx="0" cy="-8" rx="6" ry="9" fill="${fam.color}"/>
          <!-- Head -->
          <circle class="owl-head" cx="0" cy="-18" r="6" fill="${fam.color}"/>
          <!-- Eyes -->
          <circle cx="-2" cy="-18" r="1.8" fill="#fff"/>
          <circle cx="-2" cy="-18" r="0.8" fill="#000"/>
          <circle cx="2" cy="-18" r="1.8" fill="#fff"/>
          <circle cx="2" cy="-18" r="0.8" fill="#000"/>
          <!-- Beak -->
          <polygon points="0,-16 -1,-14 1,-14" fill="#e67e22"/>
          <!-- Wings -->
          <path d="M -6,-10 Q -10,-6 -6,-2" fill="none" stroke="${fam.color}" stroke-width="2" stroke-linecap="round"/>
          <path d="M 6,-10 Q 10,-6 6,-2" fill="none" stroke="${fam.color}" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;

    case 'dragon':
      // Tiny cute dragon with breathing wings
      return `
        <g transform="translate(${x}, ${y}) scale(${fam.scale})" class="familiar-dragon">
          <!-- Body -->
          <ellipse cx="0" cy="-6" rx="5" ry="7" fill="${fam.color}"/>
          <!-- Wings (flapping) -->
          <path class="dragon-wing-l" d="M -4,-8 Q -15,-15 -10,-3 Z" fill="${fam.color}" opacity="0.8"/>
          <path class="dragon-wing-r" d="M 4,-8 Q 15,-15 10,-3 Z" fill="${fam.color}" opacity="0.8"/>
          <!-- Head -->
          <path d="M -4,-18 L 4,-18 L 6,-13 L -6,-13 Z" fill="${fam.color}"/>
          <circle cx="0" cy="-15" r="5" fill="${fam.color}"/>
          <circle cx="-2" cy="-16" r="1" fill="#fff"/> <!-- Glow eye -->
          <circle cx="2" cy="-16" r="1" fill="#fff"/>
          <!-- Tail -->
          <path d="M 3,-3 Q 10,2 14,-2" fill="none" stroke="${fam.color}" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;
  }
}

// ─── Floating Mana Crystal ──────────────────────────────────
function renderManaCrystal(al: AlchemyData): string {
  // Placed in center: x = 450, y = 100
  const glowOpacity = 0.3 + al.manaCrystalGlow * 0.5;
  const glowRadius = 15 + al.manaCrystalGlow * 20;

  return `
    <g class="mana-crystal">
      <!-- Outer energy vortex -->
      <circle cx="450" cy="95" r="${glowRadius}" fill="none" stroke="${al.magicEnergyColor}" stroke-dasharray="10, 15" stroke-width="1.5" opacity="${glowOpacity}" filter="url(#magic-glow)" class="crystal-vortex"/>
      <circle cx="450" cy="95" r="${glowRadius + 15}" fill="none" stroke="${al.magicEnergyColor}" stroke-dasharray="8, 25" stroke-width="1" opacity="${glowOpacity * 0.6}" filter="url(#magic-glow)" class="crystal-vortex" style="animation-direction:reverse; animation-duration:12s"/>

      <!-- Ambient glow -->
      <polygon points="450,60 468,95 450,130 432,95" fill="${al.magicEnergyColor}" opacity="${glowOpacity}" filter="url(#magic-glow)"/>

      <!-- Core Crystal facets -->
      <polygon points="450,65 464,95 450,125 436,95" fill="url(#crystal-shade)" stroke="#fff" stroke-width="0.8"/>
      <!-- Facet divisions -->
      <line x1="450" y1="65" x2="450" y2="125" stroke="#fff" stroke-width="0.5" opacity="0.7"/>
      <line x1="436" y1="95" x2="464" y2="95" stroke="#fff" stroke-width="0.5" opacity="0.7"/>
    </g>
  `;
}

// ─── Floating Sparkle Particle ──────────────────────────────
function renderSparkle(s: SparkleData, al: AlchemyData): string {
  return `
    <circle class="mana-sparkle" cx="${s.x}" cy="${s.y}" r="${s.size}" 
      fill="${al.magicEnergyColor}" filter="url(#magic-glow)"
      style="animation-duration:${s.dur}s; animation-delay:${s.delay}s"/>
  `;
}

// ─── Warning Smoke / Glitch Cloud Overlay ───────────────────
function renderSmoke(al: AlchemyData): string {
  return `
    <!-- Thick magical fog rolling across countertop -->
    <path class="fog-cloud" d="M 0,225 C 100,210 200,210 300,225 C 400,210 500,210 600,225 C 700,210 800,210 900,225 L 900,260 L 0,260 Z" fill="rgba(155, 89, 182, 0.15)"/>
    <path class="fog-cloud" d="M 0,230 C 150,215 300,215 450,230 C 600,215 750,215 900,230 L 900,260 L 0,260 Z" fill="rgba(46, 204, 113, 0.1)" style="animation-delay:2s; animation-duration:15s"/>
  `;
}

// ─── HUD Overlay ────────────────────────────────────────────
function renderHUD(al: AlchemyData, username: string): string {
  return `
  <g>
    <rect x="8" y="8" width="220" height="22" rx="4" fill="rgba(0,0,0,0.6)" stroke="${al.shelfColor}" stroke-width="1"/>
    <text x="14" y="22" font-family="monospace" font-size="10" fill="#fff" font-weight="bold">
      🧪 ${username}'s Lab · ${al.totalContributions} transmutations
    </text>
  </g>
  <g>
    <rect x="${W - 250}" y="8" width="200" height="22" rx="4" fill="rgba(0,0,0,0.6)" stroke="${al.shelfColor}" stroke-width="1"/>
    <text x="${W - 244}" y="22" font-family="monospace" font-size="10" fill="${al.magicEnergyColor}" font-weight="bold">
      MANA: ${al.totalStars * 10} units · STREAK: ${al.streak}d
    </text>
  </g>`;
}

// ─── CSS Animations ──────────────────────────────────────────
function renderCSS(al: AlchemyData): string {
  return `
    /* Floating Mana Crystal */
    .mana-crystal {
      animation: crystal-bob 6s ease-in-out infinite alternate;
      transform-origin: 450px 95px;
    }
    @keyframes crystal-bob {
      0%   { transform: translateY(-5px) rotate(-1deg); }
      100% { transform: translateY(5px) rotate(1deg); }
    }

    /* Crystal magic ring vortex */
    .crystal-vortex {
      transform-origin: 450px 95px;
      animation: vortex-spin 8s linear infinite;
    }
    @keyframes vortex-spin {
      to { transform: rotate(360deg); }
    }

    /* Floating mana sparkles */
    .mana-sparkle {
      animation: drift-sparkle infinite ease-in-out;
    }
    @keyframes drift-sparkle {
      0%   { transform: translateY(0) scale(0.5); opacity: 0; }
      50%  { opacity: 0.8; }
      100% { transform: translateY(-30px) scale(1.1); opacity: 0; }
    }

    /* Flask bubbles */
    .flask-bubble {
      animation: flask-bubble-rise 1.5s infinite linear;
    }
    @keyframes flask-bubble-rise {
      0%   { transform: translateY(0); opacity: 0; }
      50%  { opacity: 1; }
      100% { transform: translateY(-8px); opacity: 0; }
    }

    /* Waving lab assets */
    .lab-asset {
      animation: asset-jiggle 5s ease-in-out infinite alternate;
      transform-origin: bottom center;
    }
    @keyframes asset-jiggle {
      from { transform: rotate(-1deg) scaleY(0.99); }
      to   { transform: rotate(1deg) scaleY(1.01); }
    }

    /* Familiar animations */
    .blinking-eye {
      animation: cat-blink 4s infinite step-end;
    }
    @keyframes cat-blink {
      0%, 90% { transform: scaleY(1); }
      95%     { transform: scaleY(0.1); }
    }

    .owl-head {
      animation: owl-tilt 7s ease-in-out infinite alternate;
      transform-origin: 0px -18px;
    }
    @keyframes owl-tilt {
      0%, 40%   { transform: rotate(0deg); }
      50%, 90%  { transform: rotate(-25deg); }
      100%      { transform: rotate(15deg); }
    }

    .dragon-wing-l {
      animation: flap-l 0.8s ease-in-out infinite alternate;
      transform-origin: -4px -8px;
    }
    .dragon-wing-r {
      animation: flap-r 0.8s ease-in-out infinite alternate;
      transform-origin: 4px -8px;
    }
    @keyframes flap-l {
      from { transform: rotate(-10deg); }
      to   { transform: rotate(20deg); }
    }
    @keyframes flap-r {
      from { transform: rotate(10deg); }
      to   { transform: rotate(-20deg); }
    }

    /* Rolling magical fog clouds */
    .fog-cloud {
      animation: roll-fog 10s ease-in-out infinite alternate;
    }
    @keyframes roll-fog {
      from { transform: translateX(-15px); }
      to   { transform: translateX(15px); }
    }
  `;
}
