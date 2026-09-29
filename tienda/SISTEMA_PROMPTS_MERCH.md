# Sistema de prompts detallados para merchandising (preparado 28-09 noche, para usar mañana)

Objetivo: pasar de "camiseta con solo texto" a un diseño gráfico real por producto. Mismo
espíritu que el sistema de prompts de vídeo (`h3-prompt-writing`): estructura fija, seis campos,
nada de improvisar prompt suelto por diseño.

## Por qué hacía falta esto
El catálogo actual (`/tienda/`) son ~17 diseños, todos solo tipografía sobre fondo liso — de ahí
la queja de "feo y poco creativo". La causa no es el print-on-demand en sí, es que nunca se generó
una ilustración real por diseño, solo texto.

## Estructura del prompt (6 campos fijos, por diseño)

1. **`sujeto_central`** — el elemento visual principal, nunca solo texto. Para este proyecto:
   Aielite (personaje ya establecido, referencia `AIELITE_IMG`), o un objeto simbólico (el boli,
   el robot Unitree, un icono de terminal/agente), según encaje con la frase del diseño.
2. **`composicion`** — encuadre pensado para camiseta/sudadera (formato vertical o cuadrado,
   sujeto centrado, márgenes limpios para no perder detalle al imprimir en tela) — nunca una
   composición de vídeo (planos, cámara) reutilizada sin adaptar.
3. **`estilo_grafico`** — técnica de ilustración concreta (línea limpia tipo icono vectorial,
   ilustración plana de 2-3 colores, o el estilo neon/cyberpunk ya establecido de Aielite si el
   sujeto es ella) — decidir uno, no mezclar estilos dentro del mismo diseño.
4. **`paleta`** — 2-4 colores máximo, de los ya establecidos en la marca (cian/magenta/ámbar de
   IaElite News, o negro/blanco/verde neón de Aielite) — nunca colores nuevos sin motivo.
5. **`texto_y_tipografia`** — la frase del episodio (ya escrita, no se cambia) como elemento
   SECUNDARIO: tamaño menor que la ilustración, tipografía ya usada en la marca (Orbitron para
   títulos, JetBrains Mono para texto técnico) — nunca la frase sola ocupando todo el diseño.
6. **`fondo_e_imprimibilidad`** — fondo transparente o sólido (nunca degradados complejos que no
   impriman bien en tela); verificar que el diseño funciona en color de prenda oscuro Y claro.

## Ejemplo aplicado (uno de los 17 actuales: "El agente tenía permisos. Ahí empezó todo")

```
sujeto_central: Un icono de terminal/consola con una línea de comandos, con un candado abierto
  superpuesto saliendo de la pantalla -- representa el permiso concedido de forma simple y legible
  en pequeño (impresión en camiseta).
composicion: Cuadrado, centrado, con margen generoso (mínimo 10% del lienzo) en los cuatro lados.
estilo_grafico: Icono vectorial de línea limpia, 2px de grosor constante, sin relleno degradado.
paleta: Cian (#00E5FF) y blanco sobre fondo transparente.
texto_y_tipografia: "El agente tenía permisos. Ahí empezó todo." en JetBrains Mono, mayúsculas,
  tamaño pequeño, alineado abajo del icono, nunca más ancho que el propio icono.
fondo_e_imprimibilidad: Transparente (PNG), probado sobre prenda negra y blanca antes de aprobar.
```

## Plan de aplicación (mañana, con internet rápido)
1. Generar 1 diseño de prueba con este sistema (el de arriba, ya tiene el prompt completo).
2. Revisar visualmente (igual que se hace con los vídeos: no dar nada por bueno a la primera).
3. Si funciona, aplicar a los 4-5 diseños más vendibles primero (pendiente de que el usuario
   confirme cuáles), no a los 17 de golpe.
4. Subir a Fourthwall/Printful como mockup real antes de dar cualquier diseño por definitivo.

## Prueba real hecha (28-09 noche) — resultado: NO sirve tal cual, causa encontrada

Probé un diseño de Aielite sujetando el boli (`gen-imagen.ps1` + LoRA `aielite_v4_640_rank32`,
sin referencia de imagen). Resultado real (`C:\ia\ComfyUI\output\gen_00118_.png`): la cara/pelo
sale reconocible gracias al LoRA, pero **el boli no aparece** (las manos salen vacías sobre el
pecho) y lleva auriculares que no son parte del vestuario establecido.

**Causa real**: `gen-imagen.ps1` es texto + LoRA puro, sin imagen de referencia -- el mismo
control que SÍ funciona bien en el pipeline de vídeo (que usa una imagen de referencia real vía
`<Picture N>`, no solo LoRA) no existe en este script de imagen estática. Para que un objeto
concreto (el boli) aparezca de forma fiable, hace falta el mismo enfoque de referencia de imagen
que ya usa `generar-bloques.js`, no solo un LoRA de personaje.

**Pendiente para la sesión dedicada de mañana**: adaptar el flujo de referencia de imagen
(IPAdapter o equivalente) a generación de imagen estática, o generar el boli como elemento
compuesto aparte (como ya se hace con `montar_refs_lugar.py` en Correcaminos) en vez de pedirlo
todo en un único prompt de texto.
