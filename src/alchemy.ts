import { GitHubData } from './github';

export interface LabAsset {
  weekIdx:    number;
  height:     number;      // asset height/scale
  assetType:  'vial' | 'flask' | 'alembic' | 'spellbook' | 'empty';
  color:      string;
  isBoiling:  boolean;
}

export interface FamiliarData {
  type:     'dragon' | 'owl' | 'cat';
  x:        number;
  y:        number;
  scale:    number;
  color:    string;
}

export interface SparkleData {
  id:       number;
  x:        number;
  y:        number;
  size:     number;
  dur:      number;
  delay:    number;
}

export interface AlchemyData {
  assets:             LabAsset[];
  familiars:          FamiliarData[];
  sparkles:           SparkleData[];
  wallColor:          string;
  shelfColor:         string;
  magicEnergyColor:   string;
  manaCrystalGlow:    number;    // 0 - 1 based on streak
  hasSmokePollution:  boolean;   // from open issues count
  totalStars:         number;
  totalContributions: number;
  streak:             number;
  username:           string;
}

const MAGIC_THEMES: Record<string, { wall: string, shelf: string, magic: string }> = {
  JavaScript: {
    wall: '#1e1c12', shelf: '#4a3f2b', magic: '#f1c40f'
  },
  TypeScript: {
    wall: '#0f1422', shelf: '#2a344a', magic: '#00d2ff'
  },
  Python: {
    wall: '#0f2214', shelf: '#223d29', magic: '#2ecc71'
  },
  Go: {
    wall: '#111f26', shelf: '#293a45', magic: '#00afdb'
  },
  Rust: {
    wall: '#26110f', shelf: '#45201c', magic: '#e74c3c'
  }
};

const DEFAULT_THEME = {
  wall: '#1a1824', shelf: '#3e344e', magic: '#9b59b6'
};

export function buildAlchemy(data: GitHubData): AlchemyData {
  const theme = MAGIC_THEMES[data.topLanguage] || DEFAULT_THEME;
  const allMax = Math.max(...data.weeks.flatMap(w => w.map(d => d.count)), 1);

  // 1. Build laboratory assets (52 columns, placed across shelves)
  const assets: LabAsset[] = data.weeks.map((week, i) => {
    const maxCount = Math.max(...week.map(d => d.count), 0);
    let height = 0;
    let assetType: LabAsset['assetType'] = 'empty';

    if (maxCount > 0) {
      const norm = Math.log(maxCount + 1) / Math.log(allMax + 1);
      height = Math.round(8 + norm * 45); // asset size scaling
      assetType = maxCount > 8 ? 'spellbook' : maxCount > 4 ? 'alembic' : maxCount > 2 ? 'flask' : 'vial';
    }

    const colPalette = [theme.magic, '#e67e22', '#9b59b6', '#1abc9c', '#3498db', '#e74c3c'];
    const color = colPalette[(maxCount + i) % colPalette.length];

    return {
      weekIdx: i,
      height,
      assetType,
      color,
      isBoiling: assetType === 'alembic' || (assetType === 'flask' && maxCount % 2 === 0),
    };
  });

  // 2. Build familiars (PRs / Closed issues)
  const familiars: FamiliarData[] = [];
  const seed = data.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const closedCount = data.closedIssues || 0;

  if (closedCount > 0) {
    const famCount = Math.min(3, Math.ceil(closedCount / 20));
    const types: FamiliarData['type'][] = ['cat', 'owl', 'dragon'];
    for (let i = 0; i < famCount; i++) {
      const type = types[(seed + i) % types.length];
      familiars.push({
        type,
        x: 100 + ((seed * (i + 1) * 31) % 650),
        y: 195, // Sitting on the bottom counter
        scale: 0.7 + ((seed * (i + 1) * 7) % 4) * 0.1,
        color: type === 'dragon' ? theme.magic : type === 'owl' ? '#d5c285' : '#2c3e50',
      });
    }
  }

  // 3. Sparkles/Mana energy (Stars)
  const sparkles: SparkleData[] = [];
  const sparkleCount = Math.min(35, Math.max(5, Math.floor(Math.log10(data.totalStars + 1) * 8)));
  for (let i = 0; i < sparkleCount; i++) {
    const x = ((seed * (i + 1) * 43) % 850) + 25;
    const y = ((seed * (i + 1) * 17) % 150) + 20;
    const size = 1.5 + (i % 3);
    const dur = 2 + (i % 4);
    const delay = (i * 0.3) % 5;

    sparkles.push({ id: i, x, y, size, dur, delay });
  }

  const hasSmokePollution = data.openIssues > 25;
  const manaCrystalGlow = Math.min(1, data.streak / 30);

  return {
    assets,
    familiars,
    sparkles,
    wallColor: theme.wall,
    shelfColor: theme.shelf,
    magicEnergyColor: theme.magic,
    manaCrystalGlow,
    hasSmokePollution,
    totalStars: data.totalStars,
    totalContributions: data.totalContributions,
    streak: data.streak,
    username: data.username,
  };
}
