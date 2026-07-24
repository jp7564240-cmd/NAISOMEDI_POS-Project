import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const target = resolve(root, 'src/public/legacy');
await mkdir(target, { recursive: true });

const LUXURY_FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">';

const FONT_PATCHES = [
  {
    match: /font-family:\s*Inter,\s*system-ui,\s*-apple-system;/,
    replace:
      "font-family:'Cormorant Garamond','Playfair Display',Inter,system-ui,-apple-system;font-size:17px;",
  },
  {
    match: /font-family:\s*"Space Grotesk",\s*Inter;/,
    replace: "font-family:'Playfair Display','Cormorant Garamond',serif;font-size:1.08em;",
  },
  {
    match: /font-family:'Outfit',system-ui,-apple-system,Segoe UI,Roboto;/,
    replace:
      "font-family:'Cormorant Garamond','Playfair Display',Outfit,system-ui,-apple-system,Segoe UI,Roboto;font-size:17px;",
  },
  {
    match: /<h1>/g,
    replace: "<h1 style=\"font-family:'Playfair Display','Cormorant Garamond',serif;letter-spacing:.02em;\">",
  },
];

function trimDocument(raw) {
  const end = raw.toLowerCase().indexOf('</html>');
  if (end === -1) throw new Error('No complete HTML document found');
  return raw.slice(0, end + 7);
}

function applyLuxuryFonts(html) {
  let next = html.includes('Cormorant+Garamond')
    ? html
    : html.replace('</head>', `${LUXURY_FONT_LINK}\n</head>`);

  for (const patch of FONT_PATCHES) {
    next = next.replace(patch.match, patch.replace);
  }
  return next;
}

async function publish(source, destination) {
  const raw = await readFile(resolve(root, source), 'utf8');
  const trimmed = trimDocument(raw);
  const published = applyLuxuryFonts(trimmed);
  await writeFile(resolve(target, destination), published, 'utf8');
}

await publish('legacy-source/LOGIN.txt', 'LOGIN.html');
await publish('legacy-source/HOME.txt', 'HOME.html');
await copyFile(
  resolve(root, 'vendor-legacy/Naisomedi-Luxe-Designer.html'),
  resolve(target, 'Naisomedi-Luxe-Designer.html'),
);

await copyFile(
  resolve(root, 'public/legacy/POS-Terminal.html'),
  resolve(target, 'POS-Terminal.html'),
);
