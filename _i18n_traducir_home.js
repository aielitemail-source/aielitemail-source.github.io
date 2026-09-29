// Traduce la home (index.html) a un idioma, usando Ollama LOCAL (qwen3:8b, 0
// tokens de Claude), preservando toda la estructura HTML/CSS/enlaces intactos
// -- solo se traduce el texto humano de una seccion concreta del fichero, no
// el HTML entero (evita que el LLM rompa etiquetas). Los bloques inyectados
// (<!--aie-sec-->...<!--/aie-sec--> y <!--aie-follow-->...<!--/aie-follow-->)
// se dejan tal cual: los gestiona otro script del proyecto, no este.
//
//   node _i18n_traducir_home.js pt "Portugues (de Portugal, no de Brasil)"
//   node _i18n_traducir_home.js pl "Polaco"
const fs = require('fs');
const path = require('path');
const http = require('http');

// --- turno de la tarjeta -----------------------------------------------------
// Usa Ollama local: sin esto compite por VRAM con ComfyUI/H3 sin avisar a nadie
// (medido el 23-09: los dos cargados a la vez, 94% de 8 GB). Mismo semaforo que
// producir-episodio.js (C:\ia\scripts\gpu-turno.js, servidor en el 8199).
const SEMAFORO_GPU = { host: '127.0.0.1', port: 8199 };
const QUIEN_GPU = 'traduccion';
function semaforoGpu(rutaSem) {
  return new Promise((resolve) => {
    const req2 = http.get({ host: SEMAFORO_GPU.host, port: SEMAFORO_GPU.port, path: rutaSem, timeout: 8000, agent: false }, (res) => {
      let texto = '';
      res.on('data', (d) => { texto += d; });
      res.on('end', () => {
        try { resolve({ vivo: true, codigo: res.statusCode, datos: JSON.parse(texto) }); }
        catch (error) { resolve({ vivo: true, codigo: res.statusCode, datos: null }); }
      });
    });
    req2.on('error', () => resolve({ vivo: false }));
    req2.on('timeout', () => { req2.destroy(); resolve({ vivo: false }); });
  });
}
let avisadoSinSemaforoGpu = false;
async function pedirTurnoGpu(minutos = 15) {
  for (;;) {
    const r = await semaforoGpu(`/pedir?quien=${QUIEN_GPU}&minutos=${minutos}`);
    if (!r.vivo) {
      if (!avisadoSinSemaforoGpu) { console.log('el semaforo de GPU no responde en :8199; sigo sin turno'); avisadoSinSemaforoGpu = true; }
      return;
    }
    if (r.codigo === 200) return;
    const de = r.datos && r.datos.ocupado_por ? r.datos.ocupado_por : 'otro';
    console.log(`la tarjeta la tiene ${de}: espero mi turno`);
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}
async function soltarTurnoGpu() { await semaforoGpu(`/soltar?quien=${QUIEN_GPU}`); }

const [, , LANG, NOMBRE_IDIOMA] = process.argv;
if (!LANG || !NOMBRE_IDIOMA) { console.error('uso: node _i18n_traducir_home.js <codigo> "<nombre del idioma>"'); process.exit(1); }

const SRC = path.join(__dirname, 'index.html');
const OUT_DIR = path.join(__dirname, LANG);
const OUT = path.join(OUT_DIR, 'index.html');

const html = fs.readFileSync(SRC, 'utf8');

function entre(marcaInicio, marcaFin) {
  const i = html.indexOf(marcaInicio);
  const f = html.indexOf(marcaFin, i);
  if (i === -1 || f === -1) throw new Error(`no encuentro el bloque entre "${marcaInicio}" y "${marcaFin}"`);
  return html.slice(i, f);
}

// El contenido "de verdad" de la pagina: desde el <nav> hasta el cierre de </div> justo
// antes del bloque inyectado aie-follow.
const CONTENIDO = entre('<nav class="barra">', '<!--aie-follow-->');
const TITLE = html.match(/<title>([^<]*)<\/title>/)[1];
const DESC = html.match(/<meta name="description" content="([^"]*)"/)[1];

function ollama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'qwen3:8b', prompt, stream: false, options: { temperature: 0.2 } });
    const req = http.request('http://localhost:11434/api/generate', {
      method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw).response); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Red de seguridad determinista: terminos clave que el LLM ha demostrado dejar
// sin traducir (comprobado con qwen3:8b: "boligrafo" y "Proximamente" se cuelan
// en portugues incluso pidiendo explicitamente traducir todo). No confiar solo
// en el prompt -- sustitucion literal despues de traducir, mismo patron que el
// glosario de 101 terminos del proyecto Traducciones.
const GLOSARIO = {
  pt: [[/\bbolígrafos?\b/gi, 'caneta'], [/\bPróximamente\b/g, 'Brevemente']],
  pl: [[/\bpióro\b/gi, 'długopis'], [/\bPróximamente\b/g, 'Wkrótce']],
};
function aplicarGlosario(texto) {
  for (const [re, sub] of (GLOSARIO[LANG] || [])) texto = texto.replace(re, sub);
  return texto;
}

function limpiar(t) {
  // qwen3 a veces envuelve la respuesta en ```html ... ``` o añade un preambulo.
  let s = t.trim();
  s = s.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '');
  const i = s.indexOf('<nav');
  return i > 0 ? s.slice(i) : s;
}

async function main() {
  await pedirTurnoGpu();
  console.log(`[${LANG}] traduciendo con Ollama (qwen3:8b, local)...`);

  const promptContenido = `Translate the following HTML fragment from Spanish to ${NOMBRE_IDIOMA}. `
    + 'Translate ONLY the human-readable visible text. Do NOT translate or modify any HTML tag, '
    + 'attribute, class name, href URL, or email address. Keep the exact same HTML structure, '
    + 'tags and attributes, byte for byte, changing only the text nodes. Output ONLY the '
    + 'translated HTML fragment, nothing else, no explanation, no markdown code fences.\n\n'
    + `${CONTENIDO}`;
  const contenidoTraducido = aplicarGlosario(limpiar(await ollama(promptContenido)));

  const promptCortos = `Translate these two short texts from Spanish to ${NOMBRE_IDIOMA}. Every `
    + 'single word must be translated, including brand taglines like "Próximamente" (= "coming '
    + 'soon", translate it too) -- nothing stays in Spanish. Reply with exactly two lines, one '
    + 'per text, same order, no numbering, no quotes, no explanation.\n'
    + `1) ${TITLE}\n2) ${DESC}`;
  let [tituloT, descT] = (await ollama(promptCortos)).trim().split('\n').map((s) => s.replace(/^\d\)\s*/, '').trim());
  tituloT = aplicarGlosario(tituloT);
  descT = aplicarGlosario(descT);

  let out = html
    .replace('<html lang="es">', `<html lang="${LANG}">`)
    .replace(CONTENIDO, contenidoTraducido)
    .replace(/<title>[^<]*<\/title>/, `<title>${tituloT}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${descT}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${tituloT}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${descT}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="https://aielitelab.com/${LANG}/"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="https://aielitelab.com/${LANG}/"`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, out, 'utf8');
  console.log(`[${LANG}] escrito -> ${OUT}`);
  await soltarTurnoGpu();
}

main().catch(async (e) => { console.error(`[${LANG}] FALLO:`, e.message); await soltarTurnoGpu(); process.exit(1); });
