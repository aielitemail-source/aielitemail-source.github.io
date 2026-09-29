# Plan de traducción de la web y la tienda a 14 idiomas (28-09-2026)

Lista ya cerrada (23-09, ver memoria del proyecto): **en, es, de, fr, zh, it, ru, ar, ro, pl, ca,
eu, pt, nl**. Es, en ya están. Este documento es el plan, no el trabajo terminado — es tarea de
varios días, como dijo el usuario.

## Prioridad (por qué este orden)

1. **Inglés** — ✅ hecho (28-09). Es el idioma de repliegue ("derivar al canal en inglés")
   cuando un contacto no tiene su idioma propio disponible.
2. **Francés y alemán** — ya tenemos los primeros candidatos de contacto en esos idiomas
   (`difusion/canales_ia_candidatos.csv`), así que traducir la web ahora tiene retorno inmediato.
3. **Chino, árabe, ruso, portugués** — los 4 del pedido explícito de esta tarde que aún faltan.
   Requieren más cuidado (alfabetos distintos, verificar que la traducción suena natural, no solo
   traducción literal) — candidatas para revisión humana antes de publicar nada.
4. **Italiano, rumano, polaco, catalán, euskera, neerlandés** — resto de la lista de 14, menor
   prioridad mientras no haya contactos de esos idiomas ya identificados.

## Qué se traduce, por página

- `/reto-boli/` (la página principal del reto, ya con la sección "Días" completa en ES/EN).
- Las páginas legales mínimas (aviso legal, privacidad, cookies) — algunos idiomas lo exigen para
  operar de cara al público en esa región.
- La tienda (`/tienda/`) — nombres y descripciones de producto, no hace falta duplicar el motor
  de pago (Fourthwall gestiona el idioma de checkout por su cuenta en muchos casos, verificar).

## Mecanismo técnico

Mismo patrón que `web_dias_reto.py` (diccionario `T`/`DIAS` por idioma + generador), pero
generalizado: en vez de un script nuevo por idioma, `web_dias_reto.py` ya está preparado para
añadir una entrada más al diccionario `DIAS`/`T` por cada idioma nuevo — no hace falta reescribir
el motor, solo añadir el contenido traducido idioma a idioma. Mismo criterio para el resto de
páginas de la web si se generalizan con este patrón.

## Lo que NO se resuelve con esto (limitación real, ya documentada)

El vídeo en sí sigue siendo audio en español para todos los idiomas — el doblaje multi-idioma
(XTTS/voz nativa por idioma, ya con pruebas sueltas hechas en el proyecto Traducciones) no está
construido para el Reto del Bolígrafo todavía. Traducir el TEXTO de la web no implica que el
vídeo se oiga en ese idioma. No se afirma lo contrario en ningún texto generado.

## Estado (28-09 noche, revisado -- corrige una confusión real)

- ES: hecho.
- EN: hecho (`web_dias_reto.py`, verificado visualmente).
- **PL y PT ya tienen un `index.html` en `web_staging/{pl,pt}/`, pero es SOLO la home general,
  no la página del reto** (`/reto-boli/`) -- comprobado leyendo las carpetas, no es lo mismo que
  "traducción del reto a 14 idiomas" que pedía este plan. No confundir los dos trabajos.
- **FR, DE y el resto: sin empezar de verdad.** Comprobado el alcance real antes de tocar nada:
  la página `/reto-boli/` (94 líneas) se genera desde una fuente congelada por idioma
  (`C:\ia\reto-boli\_fuente_reto\{es,en}.html`) vía `hacer_pagina_reto_boli.py` →
  `web_dias_reto.py` (necesita una entrada `'fr'` nueva en los diccionarios `DIAS`/`T`, con
  `PAGES['fr']` apuntando a una página que aún no existe) → `web_botones_redes.py`. Para hacerlo
  bien hace falta escribir antes un `fr.html` congelado con traducción real de toda la página
  (no solo la sección Días), no un mecanismo automático -- es tarea de una sesión dedicada para
  no publicar una traducción a medias o floja. No se ha empezado para no hacerlo con prisa.
