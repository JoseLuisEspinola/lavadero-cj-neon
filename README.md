# Lavadero CJ — Guía paso a paso (para principiantes)

No hace falta saber programar. Seguí los pasos **en orden** y no te saltees ninguno.
Si algún botón tiene un nombre un poquito distinto, buscá el que más se parezca.

---

## ¿Qué vamos a hacer?

Vas a usar **3 servicios gratuitos de internet**. Pensalo como una casa:

| Servicio | Para qué sirve | En la casa es... |
|---|---|---|
| **GitHub** | Guarda los archivos de tu página | el baúl donde guardás los planos |
| **Neon** | Guarda los turnos y mensajes de los clientes | el cuaderno de anotaciones |
| **Vercel** | Muestra tu página en internet para que todos entren | la puerta abierta al público |

Necesitás: una computadora, un mail y más o menos una hora.

> **Tip:** abrí el programa **Bloc de notas** y dejalo abierto. Ahí vas a ir anotando 3 datos secretos. Cada dato va en su renglón, con su nombre.

---

## PASO 0 — Abrir el paquete

1. Buscá el archivo `lavadero-cj-vercel-neon.zip` que descargaste.
2. Click derecho encima → **Extraer todo** (o "Descomprimir").
3. Se crea una carpeta llamada `lavadero-cj`. Acordate dónde quedó (por ejemplo, en Descargas).

---

## PASO 1 — Crear la cuenta en Neon (el cuaderno de turnos)

1. Entrá a **https://neon.com**
2. Tocá **Sign up** (Registrarse). Lo más fácil es **Continue with Google**. También podés usar tu mail.
3. Te va a pedir crear un proyecto. Escribí de nombre: `lavadero-cj`.
4. Donde dice **Region** (región), elegí la más cercana a Argentina. Si ves **São Paulo** o "South America", elegí esa. Lo demás dejalo como viene.
5. Tocá **Create project** (Crear proyecto) y esperá unos segundos.
6. Vas a ver una pantalla con un botón que dice **Connect** (Conectar). Tocalo.
7. Aparece un texto largo que empieza con `postgresql://`. Ese texto es la "dirección del cuaderno".
   - Si hay una opción para ver la contraseña (**Show password**), tocala para que se vea el texto completo.
   - Si hay una opción que dice **Connection pooling** (o "pooled connection"), dejala **activada**.
8. Tocá el botón **Copy** (Copiar).
9. Pegalo en el Bloc de notas, en un renglón así:

```
DATABASE_URL = (acá pegás el texto largo)
```

**IMPORTANTE:** ese texto tiene una contraseña adentro. No se lo muestres ni se lo mandes a nadie.

---

## PASO 2 — Inventar tus 2 claves secretas

Escribilas en el Bloc de notas, abajo del anterior.

**Clave del panel (ADMIN_PASSWORD):** es la contraseña con la que vos vas a entrar al panel del lavadero. Inventá una larga y difícil, de al menos 8 letras o números. Mejor si tiene 12 o más. Ejemplo (no uses este): `LavaderoCJ2026Brillante`

**Clave secreta del sistema (SESSION_SECRET):** son letras y números al azar, mínimo 16, mejor 30 o más. Golpeá el teclado sin pensar. Ejemplo (no uses este): `k8Qw2pLz9xTn4Vb7Rm3Hc6Yd1Fg5Js0`

Tu Bloc de notas tiene que quedar así:

```
DATABASE_URL = postgresql://......
ADMIN_PASSWORD = LavaderoCJ2026Brillante
SESSION_SECRET = k8Qw2pLz9xTn4Vb7Rm3Hc6Yd1Fg5Js0
```

---

## PASO 3 — Subir los archivos a GitHub (el baúl)

### 3A. Crear la cuenta
1. Entrá a **https://github.com** y tocá **Sign up**.
2. Poné tu mail, inventá una contraseña y un nombre de usuario.
3. Te mandan un código al mail. Escribilo para confirmar.

### 3B. Instalar GitHub Desktop (un programa para subir archivos fácil)
1. Entrá a **https://desktop.github.com** y descargalo.
2. Instalalo (siguiente, siguiente...) y abrilo.
3. Tocá **Sign in to GitHub.com** y entrá con tu cuenta. Aceptá lo que te pida.

### 3C. Subir la carpeta
1. En GitHub Desktop andá al menú **File** → **Add local repository...**
2. Tocá **Choose...** y elegí la carpeta `lavadero-cj` (la del Paso 0).
3. Si te dice que "no parece un repositorio de Git", tocá el link azul **create a repository**, y después **Create repository**.
4. Arriba aparece el botón **Publish repository** (Publicar repositorio). Tocalo.
5. Dejá el nombre `lavadero-cj`. **Dejá tildado "Keep this code private"** (así nadie ve tu código).
6. Tocá **Publish repository**.

Para comprobar que salió bien: entrá a github.com, y arriba a la derecha tocá tu foto → **Your repositories**. Tiene que aparecer `lavadero-cj` con carpetas adentro (`public`, `src`, `api`...).

---

## PASO 4 — Publicar la página en Vercel (la puerta abierta)

1. Entrá a **https://vercel.com** y tocá **Log in**.
2. Elegí **Continue with GitHub** (así quedan conectadas las dos cuentas). Si ya tenés cuenta de Vercel con otro método, entrá con ese.
3. Tocá **Add New...** → **Project**.
4. Aparece una lista con tus repositorios. Buscá `lavadero-cj` y tocá **Import**.
   - Si no aparece, tocá **Adjust GitHub App Permissions** (o "Install"), elegí tu cuenta y dale permiso al repositorio `lavadero-cj`. Volvé y refrescá.
5. En la pantalla **Configure Project**: **no cambies nada** (ni el nombre, ni los demás campos).
6. Buscá el desplegable **Environment Variables** y abrilo. Ahora vas a cargar **3 datos**, de a uno. Para cada uno: escribís el nombre en **Key**, pegás el valor en **Value** y tocás **Add**.

| Key (escribila EXACTO, en mayúsculas) | Value (lo copiás de tu Bloc de notas) |
|---|---|
| `DATABASE_URL` | el texto largo que empieza con `postgresql://` |
| `ADMIN_PASSWORD` | tu clave del panel |
| `SESSION_SECRET` | tu clave secreta del sistema |

   En Value pegá solo el valor, **sin** el nombre ni el signo `=`.
7. Tocá **Deploy** y esperá 1 o 2 minutos. Vas a ver una pantalla de festejo.
8. Tocá la imagen de la página, o el botón **Visit**. Esa es la dirección de tu página en internet. Guardala en favoritos.

---

## PASO 5 — Probar que todo funciona

1. Abrí tu página. Aparece una ventana: tocá **Soy cliente**.
2. Bajá hasta **Reservá tu turno**. Elegí un servicio, un día y un horario. Escribí un nombre y un teléfono inventados y tocá **Reservar turno**. Tiene que aparecer "¡Turno reservado!".
3. Volvé arriba o recargá la página y tocá **Soy administrador** (o agregá `/admin` al final de la dirección).
4. Escribí tu clave del panel (ADMIN_PASSWORD).
5. Tenés que ver el turno que reservaste. Tocá **Cancelar** para borrar la prueba.

Si todo salió así, ¡ya está funcionando! 🎉

---

## Si algo sale mal

| Qué pasa | Qué hacer |
|---|---|
| Dice **"Error interno"** o no deja reservar | Casi seguro la dirección de Neon quedó mal copiada. En Vercel: tu proyecto → **Settings** → **Environment Variables** → editá `DATABASE_URL` y pegala de nuevo. Después andá a **Deployments**, tocá los 3 puntitos del primero y elegí **Redeploy**. |
| El panel dice **"no está configurado"** | Falta `ADMIN_PASSWORD` o `SESSION_SECRET`, o no están bien escritos. Corregilos como en la fila de arriba y hacé **Redeploy**. |
| La primera reserva tarda unos segundos | Es normal: Neon "se duerme" cuando nadie lo usa y tarda en despertar. |
| La ventana "Soy administrador" aparece a los clientes | Agregá la variable `MOSTRAR_ACCESO_ADMIN` con valor `false` y hacé **Redeploy**. Vos entrás al panel con `tupagina.vercel.app/admin`. |
| Cambié una variable y no se nota | Siempre hay que hacer **Redeploy** después de cambiar variables. |

Si nada de esto sirve: sacale una captura de pantalla al error y copiá el mensaje, y pedí ayuda con eso a mano.

---

## Cómo cambiar cosas después

**Textos y precios de la página:**
1. Abrí `public/index.html` con el Bloc de notas (click derecho → Abrir con).
2. Buscá el texto (con `Ctrl + B` o `Ctrl + F`), cambialo y guardá.
3. Abrí GitHub Desktop: abajo a la izquierda escribí un resumen (por ejemplo "Cambié precios") y tocá **Commit to main**. Después tocá **Push origin** (arriba).
4. Vercel actualiza la página solo en un minuto.

**Horarios, días abiertos, cuántos autos a la vez y servicios:** abrí `src/config.js`, cambiá los valores y repetí los pasos de GitHub Desktop.

---

## Cosas importantes que tenés que saber

- **Vercel gratis es solo para uso no comercial.** Para el lavadero real revisá sus condiciones (o su plan Pro) antes de recibir clientes. Revisá también los términos de Neon.
- **Neon gratis tiene límites** de espacio y horas de uso por mes. Si se agotan, las reservas dejan de funcionar hasta el mes siguiente. Con poco movimiento es difícil que pase.
- **Copias de seguridad:** Neon guarda un historial corto. Si querés una copia propia de los turnos, exportala cada tanto desde su panel.
- **Nunca compartas** tus 3 datos secretos (DATABASE_URL, ADMIN_PASSWORD y SESSION_SECRET).
- Los precios y los términos y condiciones que trae la página son **de ejemplo**: cambialos por los reales.

---

## Para quien sepa de programación (resumen técnico)

- Stack: Node.js + Express 4, PostgreSQL (Neon) con `pg`, frontend estático en `public/`.
- Vercel: `api/index.js` exporta la app Express; `vercel.json` hace el rewrite `/api/*` → `/api`, sirve `public/` y define encabezados de seguridad.
- Las tablas se crean solas en el primer pedido (referencia en `schema.sql`).
- Reservas: transacción con `pg_advisory_xact_lock` por fecha+hora; máximo de turnos pendientes por teléfono.
- Fechas en `America/Argentina/Buenos_Aires` calculadas con `Intl`, sin depender de `TZ`.
- Configuración editable en `src/config.js`. Variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, opcionales `CUPOS` y `MOSTRAR_ACCESO_ADMIN`.
- Local: `npm install`, copiar `.env.example` a `.env`, `npm start`.
