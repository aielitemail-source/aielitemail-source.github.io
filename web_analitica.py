# -*- coding: utf-8 -*-
"""Inserta (o actualiza) en TODAS las paginas HTML de C:/ia/web_staging un banner de consentimiento
de cookies + Google Analytics 4, que solo carga el script de medicion SI el visitante acepta
(obligatorio en la UE -- GA4 usa cookies). Idempotente (marcador <!--aie-analitica-->), mismo
patron que web_botones_redes.py.

IMPORTANTE: sustituir MEASUREMENT_ID por el ID real (formato G-XXXXXXXXXX) de la propiedad GA4
antes de ejecutar -- placeholder deliberado, no funciona sin el ID real. La cuenta de GA4 solo
la puede crear el usuario (no una accion que pueda hacer un agente).

    python web_analitica.py
"""
import os
import re

ROOT = 'C:/ia/web_staging'
MEASUREMENT_ID = 'G-XXXXXXXXXX'  # <-- sustituir por el ID real antes de ejecutar

TXT = {
    'es': dict(p='Usamos Google Analytics para saber cuánta gente visita la web y qué le interesa. '
                 'No vendemos tus datos ni los usamos para publicidad.',
               aceptar='Aceptar', rechazar='Rechazar', mas='Más info',
               mas_href='/cookies/'),
    'en': dict(p='We use Google Analytics to see how many people visit the site and what they '
                 'find useful. We do not sell your data or use it for advertising.',
               aceptar='Accept', rechazar='Reject', mas='Learn more',
               mas_href='/en/cookies/'),
}

CSS = '''
#aie-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;max-width:640px;margin:0 auto 1rem;
  padding:1rem 1.2rem;border:1px solid color-mix(in oklch,var(--cian) 40%,transparent);border-radius:16px;
  background:color-mix(in oklch,var(--bg) 92%,black);color:var(--text);font:500 14px/1.5 'Space Grotesk',system-ui,sans-serif;
  box-shadow:0 8px 32px rgba(0,0,0,.45);display:flex;flex-wrap:wrap;gap:.8rem;align-items:center;justify-content:space-between}
#aie-consent p{margin:0;flex:1 1 260px;color:var(--text-dim)}
#aie-consent a{color:var(--cian)}
#aie-consent .ac-row{display:flex;gap:.5rem;flex:none}
#aie-consent button{font:700 .82rem 'Space Grotesk',sans-serif;padding:.55rem 1.1rem;border-radius:999px;cursor:pointer;border:1px solid rgba(255,255,255,.35)}
#aie-consent .ac-ok{background:var(--cian);color:#00131a;border-color:var(--cian)}
#aie-consent .ac-no{background:transparent;color:var(--text)}
'''

JS = '''(function(){
  var K='aie-consent-choice';
  function cargarGA(){
    if(window['aie-ga-loaded'])return; window['aie-ga-loaded']=true;
    var s=document.createElement('script');s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id=__MID__';
    document.head.appendChild(s);
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments)}
    gtag('js',new Date());gtag('config','__MID__',{anonymize_ip:true});
  }
  function elegido(v){
    try{localStorage.setItem(K,v)}catch(e){}
    var b=document.getElementById('aie-consent');if(b)b.remove();
    if(v==='1')cargarGA();
  }
  var previo=null; try{previo=localStorage.getItem(K)}catch(e){}
  if(previo==='1'){cargarGA();return}
  if(previo==='0'){return}
  var b=document.getElementById('aie-consent');
  if(b){
    b.querySelector('.ac-ok').onclick=function(){elegido('1')};
    b.querySelector('.ac-no').onclick=function(){elegido('0')};
  }
})();'''


def bloque(lang):
    t = TXT[lang]
    js = JS.replace('__MID__', MEASUREMENT_ID)
    return (f'<!--aie-analitica--><style>{CSS}</style>'
            f'<div id="aie-consent" role="dialog" aria-label="Cookies"><p>{t["p"]} '
            f'<a href="{t["mas_href"]}">{t["mas"]}</a></p>'
            f'<div class="ac-row"><button type="button" class="ac-no">{t["rechazar"]}</button>'
            f'<button type="button" class="ac-ok">{t["aceptar"]}</button></div></div>'
            f'<script>{js}</script><!--/aie-analitica-->')


def main():
    if MEASUREMENT_ID == 'G-XXXXXXXXXX':
        raise SystemExit('Sustituye MEASUREMENT_ID por el ID real de GA4 antes de ejecutar.')
    n = 0
    for d, ds, fs in os.walk(ROOT):
        ds[:] = [x for x in ds if x not in ('.git', 'media', 'assets')]
        for f in fs:
            if not f.endswith('.html'):
                continue
            p = os.path.join(d, f)
            rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
            s = open(p, encoding='utf-8').read()
            if len(s) < 1000 or '<body' not in s:
                continue
            s = re.sub(r'<!--aie-analitica-->.*?<!--/aie-analitica-->', '', s, flags=re.S)
            en = rel.startswith('en/') or rel in ('privacy.html', 'terms.html')
            blk = bloque('en' if en else 'es')
            if '</body>' in s:
                s = s.replace('</body>', blk + '</body>', 1)
            else:
                s += blk
            open(p, 'w', encoding='utf-8', newline='').write(s)
            n += 1
    print(n, 'páginas con banner de consentimiento + Google Analytics (GA4:', MEASUREMENT_ID, ')')


if __name__ == '__main__':
    main()
