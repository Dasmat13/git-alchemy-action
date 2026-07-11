import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { fetchGitHubData } from './github';
import { buildAlchemy } from './alchemy';
import { renderSVG } from './renderer';

async function run(): Promise<void> {
  try {
    const username  = core.getInput('github_user_name', { required: true });
    const token     = core.getInput('github_token',      { required: true });
    const outPath   = core.getInput('svg_out_path')     || 'dist/alchemy.svg';

    core.info(`🧪 Generating GitAlchemy for @${username}...`);

    core.info('📡 Fetching GitHub data...');
    const data = await fetchGitHubData(username, token);

    core.info('🏗️ Building alchemical room layout...');
    const alchemy = buildAlchemy(data);

    core.info('🎨 Rendering SVG...');
    const svg = renderSVG(alchemy, username);

    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, svg, 'utf8');

    core.info(`✅ GitAlchemy SVG written to ${outPath}`);
    core.setOutput('svg_path', outPath);
  } catch (err: unknown) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();
