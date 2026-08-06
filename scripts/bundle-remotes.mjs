// Empacota o build estático dos 5 remotes federados (repos-irmãos) dentro de
// build/assets/ do Shell. Substitui `mkdir -p && cp -r` (POSIX puro, quebra
// no cmd.exe do Windows com "The syntax of the command is incorrect") por
// fs.cpSync, que funciona igual nos 3 SOs.
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shellRoot = path.resolve(__dirname, '..');

const remotes = [
	{ repo: 'sp-ui-chat', asset: 'sp_ui_chat' },
	{ repo: 'sp-ui-vault', asset: 'sp_ui_vault' },
	{ repo: 'sp-ui-projects', asset: 'sp_ui_projects' },
	{ repo: 'sp-ui-rag', asset: 'sp_ui_rag' },
	{ repo: 'sp-ui-coding', asset: 'sp_ui_coding' }
];

for (const { repo, asset } of remotes) {
	const src = path.join(shellRoot, '..', repo, 'build');
	const dest = path.join(shellRoot, 'build', 'assets', asset);
	mkdirSync(dest, { recursive: true });
	cpSync(src, dest, { recursive: true });
	console.log(`Bundled ${repo}/build -> build/assets/${asset}/`);
}
