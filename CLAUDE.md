# CLAUDE.md — REPÓRTATE

> **Propósito de este archivo**: Memoria persistente del proyecto para el asistente IA. Cada sesión nueva debe leer este archivo antes de escribir una sola línea de código. Contiene arquitectura, decisiones de diseño, esquema de datos y reglas del sistema. No repetir información ya documentada aquí — referenciar esta fuente.

---

## Qué es REPÓRTATE

Aplicación móvil multiplataforma (Android + iOS) de **control de presencia diaria y seguridad grupal**. Los miembros de un grupo organizado confirman el inicio y fin de su jornada laboral mediante botones dedicados. Ante una emergencia, cualquier miembro puede activar un **SOS** que transmite su ubicación GPS en tiempo real a todo el grupo.

**Para quién**: Equipos de trabajo en campo, grupos de seguridad comunitaria, comunidades organizadas con estructura jerárquica (capitán / miembro).

**Problema que resuelve**: Visibilidad de presencia sin fricción, trazabilidad de jornada y canal de emergencia unificado en una sola app.

---

## Funcionalidades Core

### 1. Autenticación
- Registro con email + password + nombre completo + foto de perfil (opcional, subida a Supabase Storage)
- Inicio de sesión con sesión persistente (Supabase Auth, JWT)
- Recuperación de contraseña vía email
- Al registrarse, se crea automáticamente el registro en la tabla `users`

### 2. Roles
- `captain`: puede crear grupos, ver ubicación de miembros al fin de jornada, enviar alertas de ausencia, gestionar invitaciones
- `member`: puede reportar jornada, activar SOS, ver estado de compañeros en su grupo
- El rol se asigna por grupo (`group_members.role`), no globalmente. Un usuario puede ser capitán en un grupo y miembro en otro

### 3. Grupos
- Los capitanes crean grupos con nombre, descripción y foto
- Membresía **solo por invitación** — no hay búsqueda pública de grupos
- El capitán genera un token de invitación (link profundo o código de 6 caracteres) con fecha de expiración
- Un usuario puede pertenecer a múltiples grupos

### 4. Botón 1 — Inicio de Jornada ⚠️ REMOVIDO DE HOME
- Lógica y componente (`JourneyButton`, `useJourney`) siguen existiendo en el código
- **Eliminado de `home.tsx`** — ya no se muestra en la pantalla principal
- Si se necesita reintegrar: agregar de vuelta el Card con `JourneyButton` y restaurar los imports

### 5. Botón 2 — Fin de Jornada ⚠️ REMOVIDO DE HOME
- Misma situación que Botón 1 — lógica intacta, UI removida de `home.tsx`

### 6. Alerta de Ausencia
- Solo capitanes pueden activar esta función
- El sistema compara miembros del grupo vs. registros `reports` del día actual
- Se genera lista de miembros sin reporte de fin de jornada
- El capitán envía notificación push grupal: `"Los siguientes miembros aún no han finalizado: {lista}"`
- El capitán puede personalizar el mensaje antes de enviarlo

### 7. Botón SOS — Emergencia
- Accesible desde cualquier pantalla (botón flotante o tab dedicado)
- **Flujo de confirmación obligatorio**: modal con cuenta regresiva de 3 segundos y botón "Cancelar". Si no se cancela, se activa
- Al activarse:
  - Se crea registro en `sos_events` con `status: 'active'` y ubicación GPS inicial
  - Se inicia tracking de ubicación en tiempo real (`expo-location` con `watchPositionAsync`)
  - Se actualizan las coordenadas en `sos_events` vía Supabase Realtime
  - Notificación push inmediata a **todos los miembros del grupo** (capitanes + miembros): `"🆘 {Nombre} ha activado una alerta de emergencia"`
- El usuario puede desactivar el SOS desde la app → `status: 'resolved'`
- Feedback háptico intenso (`Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`) al activar
- Botón visualmente diferenciado: rojo, grande, con animación de pulso

### 8. Botones de Reporte Personalizados
- Los capitanes crean hasta 5 botones por grupo (`report_buttons`) con nombre, icono, hora de activación y ventana de tiempo
- Cada botón tiene un estado: `upcoming` / `active` / `completed` / `expired`
- Al pulsar un botón activo se registra en `custom_reports` con timestamp y (si es `is_home_button`) ubicación GPS
- Notificación push a todos los miembros del grupo al pulsar
- Recordatorio local programado (`expo-notifications`) a la hora de activación cada día
- El botón de casa (`is_home_button: true`) captura GPS — solo puede haber uno por grupo

### 9. Notificaciones Push
- Proveedor: **Expo Notifications + FCM** — requiere `google-services.json` en la raíz para builds de EAS
- Tokens de dispositivo almacenados en `users.expo_push_token`
- Envío desde **Supabase Edge Functions** (`supabase/functions/send-notification/`)
- `getExpoPushTokenAsync` **debe** recibir `{ projectId }` desde `Constants.expoConfig.extra.eas.projectId` — sin esto los tokens son `null` y ninguna notificación llega
- Tipos de notificación: `JOURNEY_START`, `JOURNEY_END`, `ABSENCE_ALERT`, `SOS_ACTIVATED`, `SOS_RESOLVED`, `CUSTOM_REPORT`
- SOS llega a **todos los miembros** del grupo (sin filtro de rol)

### 9. UX/UI Profesional
- Sistema de diseño consistente con tokens definidos en `constants/theme.ts`
- Siempre mostrar estados de carga (skeleton o spinner), error (mensaje + retry) y vacío (ilustración + CTA)
- Transiciones fluidas entre pantallas con Expo Router
- Soporte de modo oscuro desde la primera versión (usar `useColorScheme`)
- Accesibilidad: labels en todos los elementos interactivos (`accessibilityLabel`, `accessibilityRole`)

---

## Stack Tecnológico

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | **React Native + Expo SDK 54** | Multiplataforma real, ecosistema maduro, OTA updates |
| Navegación | **Expo Router v3** (file-based) | Convención sobre configuración, deep links nativos |
| Backend/BaaS | **Supabase** | Auth + PostgreSQL + Realtime + Storage + Edge Functions en uno |
| Notificaciones | **Expo Notifications + FCM** | Integración nativa con Expo, soporte Android/iOS |
| GPS | **expo-location** | API unificada, permisos manejados por Expo |
| Estado global | **Zustand** | Mínimo boilerplate, sin Provider hell, compatible con React Native |
| Estilos | **NativeWind v4** | Tailwind en RN, consistencia con web si se usa Expo Web |
| Iconos | **@expo/vector-icons** (Ionicons) | Sin configuración extra, consistencia visual iOS/Android |
| Hápticos | **expo-haptics** | Feedback físico para SOS y acciones críticas |
| TypeScript | Estricto (`strict: true`) | Tipado en toda la base de código, sin excepciones |

---

## Estructura de Carpetas

```
REPÓRTATE/
│
├── app/                              # Rutas Expo Router (cada archivo = una ruta)
│   ├── _layout.tsx                   # Root layout: providers globales, sesión
│   ├── index.tsx                     # Redirect según estado de auth
│   │
│   ├── (auth)/                       # Rutas públicas (sin sesión)
│   │   ├── _layout.tsx               # Layout sin tabs, fondo de marca
│   │   ├── login.tsx                 # Pantalla de inicio de sesión
│   │   ├── register.tsx              # Registro de nuevo usuario
│   │   ├── forgot-password.tsx       # Recuperación de contraseña
│   │   └── verify-email.tsx          # Pantalla de éxito post-verificación de email
│   │
│   └── (app)/                        # Rutas protegidas (requieren sesión)
│       ├── _layout.tsx               # Verifica sesión; redirige a (auth) si no hay
│       │
│       ├── (tabs)/                   # Navegación principal por tabs
│       │   ├── _layout.tsx           # Configuración de tabs (iconos, labels)
│       │   ├── home.tsx              # Dashboard: botones de reporte, llegada a casa, SOS
│       │   ├── group.tsx             # Vista de miembros, actividad del día, botones de reporte
│       │   ├── sos.tsx               # Tab SOS (o botón flotante global)
│       │   └── profile.tsx           # Perfil del usuario, logout
│       │
│       └── group/
│           ├── [id].tsx              # Detalle de un grupo específico
│           ├── create.tsx            # Crear nuevo grupo (solo capitanes)
│           ├── join.tsx              # Unirse por código de 6 caracteres
│           ├── buttons.tsx           # Gestión de botones de reporte (capitán)
│           ├── invite.tsx            # Generar/compartir invitación ⏳ pendiente
│           └── members.tsx           # Gestión de miembros (solo capitanes)
│
├── components/
│   ├── ui/                           # Átomos reutilizables
│   │   ├── Button.tsx                # Botón base con variantes (primary, danger, ghost)
│   │   ├── Card.tsx                  # Contenedor con sombra y radio
│   │   ├── Avatar.tsx                # Imagen de perfil con fallback a iniciales
│   │   ├── Badge.tsx                 # Etiqueta de estado (activo, inactivo, SOS)
│   │   ├── Input.tsx                 # Campo de texto con label y error
│   │   ├── Modal.tsx                 # Modal base reutilizable
│   │   ├── Skeleton.tsx              # Placeholder de carga
│   │   └── EmptyState.tsx            # Estado vacío con ilustración y CTA
│   │
│   └── features/                     # Componentes de dominio
│       ├── JourneyButton.tsx         # Botón inicio/fin jornada (removido de home.tsx)
│       ├── SOSButton.tsx             # Botón SOS con animación de pulso
│       ├── SOSConfirmModal.tsx       # Modal de confirmación con cuenta regresiva (5 s)
│       ├── MemberCard.tsx            # Tarjeta de miembro con estado de jornada
│       ├── GroupHeader.tsx           # Encabezado de grupo con info y acciones
│       ├── AbsenceAlertModal.tsx     # Modal para enviar alerta de ausencia
│       ├── ReportButtonGrid.tsx      # Grilla de botones de reporte (estado day_inactive incluido)
│       ├── ReportButtonEditor.tsx    # Formulario creación/edición de botones con selector de días
│       ├── GroupPickerSheet.tsx      # Bottom sheet para cambiar grupo activo
│       ├── GroupDeleteSheet.tsx      # Bottom sheet 2 etapas para eliminar grupo (capitán)
│       ├── DayActivitySheet.tsx      # Bottom sheet actividad diaria (Reportes/Emergencias/Pending) con Realtime
│       └── HomeArrivalButton.tsx     # Botón circular "Llegada a casa" con GPS
│
├── hooks/
│   ├── useAuth.ts                    # Estado de sesión, login, logout, registro
│   ├── useGroup.ts                   # CRUD de grupo, membresía
│   ├── useJourney.ts                 # Lógica de botones 1 y 2, estado del día
│   ├── useSOS.ts                     # Activación, tracking y desactivación de SOS (todos los grupos)
│   ├── useNotifications.ts           # Registro de token, permisos, listeners, canal Android
│   ├── useLocation.ts               # Solicitud de permisos GPS y obtención de coordenadas
│   └── useReportButtons.ts          # Estado, press, recordatorios, días activos
│
├── store/
│   ├── authStore.ts                  # Usuario actual, token de sesión (Zustand)
│   ├── groupStore.ts                 # Grupos del usuario, miembros activos
│   └── sosStore.ts                   # Estado activo de SOS en el grupo
│
├── services/
│   ├── supabase/
│   │   ├── client.ts                 # Instancia de Supabase (singleton)
│   │   ├── auth.ts                   # Funciones de autenticación
│   │   ├── groups.ts                 # Queries de grupos e invitaciones
│   │   ├── reports.ts                # Insertar y consultar reports de jornada
│   │   ├── sos.ts                    # CRUD de sos_events, suscripción realtime
│   │   └── reportButtons.ts          # CRUD de report_buttons y custom_reports
│   │
│   ├── notifications/
│   │   ├── registerToken.ts          # Registrar expo push token en Supabase
│   │   └── sendNotification.ts       # Llamar Edge Function para enviar push
│   │
│   └── location/
│       └── getCurrentLocation.ts     # Obtener coordenadas actuales con permisos
│
├── constants/
│   ├── theme.ts                      # Tokens de color, tipografía, espaciado, radios
│   ├── strings.ts                    # Todos los textos visibles al usuario
│   └── config.ts                     # URLs, timeouts, flags de feature
│
├── types/
│   ├── database.ts                   # Tipos generados o manuales del esquema Supabase
│   ├── navigation.ts                 # Tipos de parámetros de rutas
│   └── index.ts                      # Re-exports de tipos globales
│
├── utils/
│   ├── formatDate.ts                 # Formateo de fechas y timestamps
│   ├── validateEmail.ts              # Validación de email
│   ├── formatDays.ts                 # WEEK_DAYS, formatActiveDays(), isTodayActive()
│   └── parseWKB.ts                   # Parser EWKB hex para coordenadas PostGIS
│   └── groupByDay.ts                 # Agrupar reports por día calendario
│
├── assets/
│   ├── images/                       # Splash screen, onboarding, ilustraciones
│   ├── fonts/                        # Fuentes custom (si aplica)
│   └── icons/                        # Iconos SVG custom (si aplica)
│
├── supabase/
│   ├── migrations/                   # SQL de migraciones de base de datos
│   └── functions/
│       └── send-notification/        # Edge Function para envío de push
│           └── index.ts
│
├── google-services.json              # Credenciales FCM para Android (EAS build) — NO al repo
├── .env                              # Variables de entorno locales (nunca al repo)
├── .env.example                      # Plantilla de variables (sí al repo)
├── app.json                          # Configuración de Expo (incluye googleServicesFile)
├── eas.json                          # Perfiles de build: development (APK), preview (APK), production (AAB)
├── babel.config.js
├── tsconfig.json                     # strict: true
└── package.json
```

---

## Esquema de Base de Datos (Supabase / PostgreSQL)

> Todas las tablas tienen RLS (Row Level Security) habilitado. Los policies se definen en `supabase/migrations/`.

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, referencia a `auth.users.id` |
| `full_name` | `text` | NOT NULL |
| `avatar_url` | `text` | URL en Supabase Storage |
| `expo_push_token` | `text` | Token de notificaciones del dispositivo |
| `created_at` | `timestamptz` | DEFAULT now() |

### `groups`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `description` | `text` | |
| `avatar_url` | `text` | |
| `created_by` | `uuid` | FK → `users.id` |
| `created_at` | `timestamptz` | |

### `group_members`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `group_id` | `uuid` | FK → `groups.id` |
| `user_id` | `uuid` | FK → `users.id` |
| `role` | `text` | `'captain'` o `'member'` |
| `joined_at` | `timestamptz` | |
| `promoted_by` | `uuid` | FK → `users.id` ON DELETE SET NULL — quién promovió |
| `promoted_at` | `timestamptz` | Cuándo fue promovido |

*Índice único en `(group_id, user_id)`.*

> ⚠️ **PostgREST FK ambigüedad**: `group_members` tiene DOS foreign keys a `users` (`user_id` y `promoted_by`). TODA query que haga embed de `users` desde esta tabla DEBE usar el hint explícito `users!user_id(field)` — nunca `users(field)` a secas. Si no, PostgREST falla silenciosamente.

### `invitations`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `group_id` | `uuid` | FK → `groups.id` |
| `token` | `text` | Código único de 6 caracteres o UUID corto |
| `created_by` | `uuid` | FK → `users.id` (capitán) |
| `expires_at` | `timestamptz` | Típicamente 24–72 horas desde creación |
| `used_at` | `timestamptz` | NULL si aún no fue usada |
| `used_by` | `uuid` | FK → `users.id` |

### `reports`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `users.id` |
| `group_id` | `uuid` | FK → `groups.id` |
| `type` | `text` | `'start'` o `'end'` |
| `location` | `geography(POINT, 4326)` | Solo en `type = 'end'`; null en `start` |
| `created_at` | `timestamptz` | Timestamp del reporte |

*RLS policy: la ubicación (`location`) en registros `end` solo es visible para capitanes del grupo.*

### `sos_events`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `users.id` |
| `group_id` | `uuid` | FK → `groups.id` |
| `location` | `geography(POINT, 4326)` | Actualizado en tiempo real durante el SOS |
| `status` | `text` | `'active'` o `'resolved'` |
| `activated_at` | `timestamptz` | |
| `resolved_at` | `timestamptz` | NULL si sigue activo |

*Supabase Realtime habilitado en esta tabla para streaming de coordenadas.*

---

## Sistema de Diseño

Definido en `constants/theme.ts`. Nunca usar valores hardcodeados en componentes.

### Paleta de Colores

```ts
export const Colors = {
  // Primario — azul marino profesional
  primary:   { 50: '#E8F0FE', 500: '#1A56DB', 700: '#1E3A8A', 900: '#0F2266' },

  // Acento — verde de confirmación/presencia
  success:   { light: '#D1FAE5', DEFAULT: '#10B981', dark: '#065F46' },

  // SOS / Peligro — rojo visible y urgente
  danger:    { light: '#FEE2E2', DEFAULT: '#EF4444', dark: '#991B1B', pulse: '#DC2626' },

  // Advertencia
  warning:   { light: '#FEF3C7', DEFAULT: '#F59E0B', dark: '#92400E' },

  // Neutros
  neutral:   {
    0:   '#FFFFFF',
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    600: '#4B5563',
    800: '#1F2937',
    900: '#111827',
  },

  // Semánticos
  background: { light: '#F9FAFB', dark: '#111827' },
  surface:    { light: '#FFFFFF', dark: '#1F2937' },
  text:       { primary: '#111827', secondary: '#4B5563', inverse: '#FFFFFF' },
};
```

### Tipografía

```ts
export const Typography = {
  family: {
    heading: 'System',   // Sustituir por fuente display si se incorpora (ej. Inter, Poppins)
    body:    'System',
    mono:    'SpaceMono',
  },
  size: {
    xs:   12, sm: 14, base: 16,
    lg:   18, xl: 20, '2xl': 24,
    '3xl': 30, '4xl': 36,
  },
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
  },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
};
```

### Espaciado (escala de 4px)

```ts
export const Spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16,
  5: 20, 6: 24, 8: 32, 10: 40,
  12: 48, 16: 64, 20: 80,
};
```

### Bordes y Radios

```ts
export const Radius = {
  sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999,
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
};
```

### Botón SOS

- Color de fondo: `Colors.danger.DEFAULT` (`#EF4444`)
- Tamaño mínimo: 80×80px (circular) o ancho completo con altura 64px
- Animación: pulso continuo con `Animated.loop` sobre `scale` (0.95 → 1.05) y `opacity` (0.8 → 1)
- Feedback háptico: `Haptics.notificationAsync(NotificationFeedbackType.Error)` al activar
- Confirmación: modal con cuenta regresiva de 3 s; el usuario debe mantener pulsado o confirmar activamente

### Iconografía

- Librería principal: `Ionicons` de `@expo/vector-icons`
- Iconos clave: `alarm` (SOS), `checkmark-circle` (fin jornada), `play-circle` (inicio jornada), `people` (grupo), `notifications` (alertas)
- Tamaño base: 24px en UI general, 32px en botones de acción, 48px+ en SOS

---

## Variables de Entorno

Definidas en `.env` (local, nunca al repo). Plantilla en `.env.example`.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Solo en Edge Functions, nunca en cliente
```

Uso en código: `process.env.EXPO_PUBLIC_SUPABASE_URL` (el prefijo `EXPO_PUBLIC_` lo expone al bundle del cliente).

---

## Checklist de Seguridad — OBLIGATORIO antes de cualquier deploy o push público

> Esta sección se ejecuta **antes de cada `git push` a rama pública, build de producción, o deploy a cualquier entorno accesible desde internet**. No es opcional.

### 1. Secretos y variables de entorno
- [ ] `git diff --cached | grep -iE "private_key|password|secret|api_key|token|anon_key|service_role|0x[a-f0-9]{64}"` — cero resultados
- [ ] `.env`, `.env.local`, `.env.production` están en `.gitignore` y **no aparecen** en `git status`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no está en ningún archivo del bundle cliente (`app/`, `components/`, `hooks/`, `store/`, `services/`)
- [ ] `EXPO_PUBLIC_*` solo expone claves de **anon key** (no service role, no private keys)
- [ ] No hay ningún valor hardcodeado de URL, token o credencial en `constants/config.ts` u otros archivos versionados

### 2. RLS y base de datos
- [ ] Todas las tablas tienen RLS habilitado — verificar con `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] La columna `location` en `reports` (tipo `end`) solo es visible para capitanes — policy vigente en Supabase
- [ ] `sos_events.location` está protegida: solo miembros del mismo grupo pueden leer
- [ ] No hay policies con `USING (true)` sin justificación documentada
- [ ] Los tokens de invitación se validan `expires_at > now()` en el servidor, no solo en cliente

### 3. Edge Functions
- [ ] Ninguna Edge Function expone datos sin verificar el JWT del usuario (`Authorization: Bearer <token>`)
- [ ] El `SUPABASE_SERVICE_ROLE_KEY` se lee desde variables de entorno de la función, no hardcodeado
- [ ] Las Edge Functions validan el `group_id` del usuario antes de enviar notificaciones push

### 4. Notificaciones push
- [ ] Los tokens `expo_push_token` se usan solo desde Edge Functions, nunca desde el cliente directamente
- [ ] No se loggea el contenido de notificaciones con datos personales (nombre, ubicación GPS)

### 5. Código cliente
- [ ] No hay `console.log` con datos de usuario, coordenadas GPS, tokens o IDs sensibles en código de producción
- [ ] Las coordenadas GPS nunca se muestran en texto plano en la UI (solo en mapa o compartidas con capitán)
- [ ] Los errores de Supabase capturados con `catch` no se muestran al usuario con el mensaje interno — usar mensajes genéricos de `constants/strings.ts`
- [ ] No hay `rejectUnauthorized: false`, `ssl: false`, ni `verify=False` en ninguna configuración de red

### 6. Permisos de dispositivo
- [ ] El permiso de ubicación (`expo-location`) se solicita solo cuando el usuario activa SOS o finaliza jornada — no al arrancar la app
- [ ] El permiso de notificaciones se solicita con explicación contextual, no al primer launch sin justificación

### 7. Dependencias
- [ ] `npm audit` (o `expo doctor`) sin vulnerabilidades críticas o altas sin parche disponible
- [ ] No hay paquetes con `postinstall` scripts sospechosos en `package.json`

### Procedimiento
```bash
# 1. Verificar secretos staged
git diff --cached | grep -iE "private_key|password|secret|api_key|token|anon_key|service_role"

# 2. Verificar que .env no está staged
git status | grep -E "\.env"

# 3. Audit de dependencias
npm audit --audit-level=high

# 4. Buscar logs con datos sensibles
grep -rn "console.log" app/ hooks/ services/ | grep -iE "location|token|password|email|gps|lat|lng"
```

Si **cualquier ítem falla**, detener el push, corregir y repetir el checklist desde cero.

---

## Estado Actual del Proyecto (2026-05-17, sesión 3)

### Infraestructura
- **Supabase project**: `msokvacqoptnanyamyoc` (plan free, org "Noland")
- **EAS project**: `@noland4/reportate` — projectId `fb2b163c-997b-4b32-85fb-dd1ad93c6865`
- **Firebase project**: `reportate-prod` — `google-services.json` en raíz (NO al repo)

### Build activo
- Perfil `preview` (APK standalone, sin dev client, sin Metro)
- Comando: `eas build --platform android --profile preview`
- Push notifications **no** dependen del WiFi — llegan por internet (FCM → Expo → dispositivo)
- OTA updates configurado (`expo-updates` + EAS Update)

### Funcionalidades implementadas ✓
- Autenticación: login, registro, logout, sesión persistente
- **Verificación de email**: `signUp` incluye `emailRedirectTo: 'reportate://verify-email'`; pantalla `app/(auth)/verify-email.tsx` con diseño de éxito (checkmark verde)
- Crear y eliminar grupos (solo capitanes); `GroupPickerSheet` para cambiar grupo activo; `GroupDeleteSheet` con confirmación 2 etapas
- Unirse a grupo por código de 6 caracteres (`app/(app)/group/join.tsx`)
- Botones de reporte personalizados: crear, grilla, press con notificación grupal, recordatorio local, **días activos por botón** (`active_days int[]`, selector L–D, estado `day_inactive`)
- Botón SOS: activación con confirmación (5 s countdown), tracking GPS, notifica **todos los grupos** del usuario (no solo el activo); incluye coords GPS en payload
- Botón "Llegada a casa" en home: GPS + notificación grupal, graba en tabla `home_arrivals`
- Panel de actividad diaria (`DayActivitySheet`): bottom sheet 3 pestañas (Reportes / Emergencias / Sin reportar), Realtime, badge de unread
- Edge Function `send-notification` desplegada
- **Revocación de rol Admin**: el creador del grupo puede quitar el rol Admin a otros admins. `MemberCard` muestra estrella dorada al creador, ícono rojo al creador sobre admins promovidos
- **Rol "Admin"**: el valor en DB sigue siendo `'captain'`; en toda la UI se muestra como "Admin" (`STRINGS.GROUP.CAPTAIN_BADGE = 'Admin'`)

### Funcionalidades pendientes
- Invitaciones: generar código para capitanes (`app/(app)/group/invite.tsx`) — pantalla `join.tsx` ya existe
- Alerta de ausencia (función de capitán — lógica existe en `group.tsx`)
- Vista de ubicación de miembros en fin de jornada (solo capitanes)

### Esquema DB adicional — tablas nuevas
#### `report_buttons`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `group_id` | `uuid` | FK → `groups.id` |
| `name` | `text` | Nombre visible |
| `icon` | `text` | Nombre de Ionicon |
| `activation_hour` | `int` | Hora de activación (0–23) |
| `activation_minute` | `int` | Minuto de activación |
| `window_minutes` | `int` | Duración ventana activa |
| `is_home_button` | `bool` | Captura GPS al pulsar |
| `sort_order` | `int` | Orden en la grilla (1–5) |
| `active_days` | `int[]` | Días JS activos (0=Dom … 6=Sáb); DEFAULT todos |
| `created_by` | `uuid` | FK → `users.id` |

#### `custom_reports`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `button_id` | `uuid` | FK → `report_buttons.id` |
| `user_id` | `uuid` | FK → `users.id` |
| `group_id` | `uuid` | FK → `groups.id` |
| `location` | `geography(POINT, 4326)` | Solo si `is_home_button` |
| `created_at` | `timestamptz` | |

#### `home_arrivals`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `users.id` |
| `group_id` | `uuid` | FK → `groups.id` |
| `location` | `geography(POINT, 4326)` | GPS al pulsar |
| `report_date` | `date` | Fecha local del reporte |
| `created_at` | `timestamptz` | |

### Migraciones
- ✓ `001_initial_schema.sql`
- ✓ `002_add_group_delete_policy.sql`
- ⏳ `003_fix_invitation_policies.sql` — pendiente de verificar/aplicar
- ⏳ `004_report_buttons.sql` — pendiente de verificar/aplicar
- ✓ `005_add_active_days.sql`
- ✓ `006_group_members_read_custom_reports.sql`
- ✓ `007_users_group_members_read.sql` — CRÍTICA: permite ver nombres/avatares de compañeros
- ✓ `008_realtime_custom_reports.sql`
- ✓ `009_allow_multiple_gps_buttons.sql`
- ✓ `010_home_arrivals.sql`
- ✓ `011_promote_member_policy.sql` — política RLS para que capitanes promuevan miembros
- ✓ `012_revoke_captain_policy.sql` — agrega `promoted_by`/`promoted_at` a `group_members`; dos políticas UPDATE separadas: promoción (cualquier admin) y revocación (solo creador del grupo)

### Bugs resueltos críticos
| Bug | Síntoma | Fix |
|---|---|---|
| `getExpoPushTokenAsync` sin `projectId` | Tokens `null` en DB | `registerToken.ts`: pasar `{ projectId: Constants.expoConfig.extra.eas.projectId }` |
| Sin `google-services.json` | FCM no funciona en EAS | Agregar archivo + `googleServicesFile` en `app.json` |
| RLS `auth.uid()` en policies | INSERT fallaba | Usar `(select auth.uid())` en todas las policies |
| Invalid Refresh Token en hot reload | Error silencioso en dev | Detectar `TOKEN_REFRESHED` sin sesión en `onAuthStateChange` y llamar `clear()` |
| `Legacy API keys are disabled` | Login roto tras migración Supabase | Actualizar `EXPO_PUBLIC_SUPABASE_ANON_KEY` a publishable key (`sb_publishable_...`) |
| Ghost notifications (botones eliminados) | Recordatorios llegaban de botones borrados | Cancelar los 8 IDs posibles por botón; fix stale closure con `rawButtonsRef` |
| PostGIS WKB hex en `location` | Coordenadas no parseables desde JS | `utils/parseWKB.ts` — parser EWKB compartido |
| Flash de empty state en home | `isLoadingGroups` iniciaba en `false` | `groupStore.ts`: inicializar `isLoading: true` |
| Verificación de email sin pantalla | Redirigía a URL rota del dashboard | `emailRedirectTo: 'reportate://verify-email'` + pantalla `verify-email.tsx` |
| FK ambigüedad tras migración 012 | Miembros vacíos, edge function 500, DayActivitySheet vacío, SOS/HomeArrival fallaban | `users!user_id(field)` en TODA query desde `group_members` que embeds `users` |
| Login spinner permanente (primer inicio) | App bloqueada en `ActivityIndicator` tras login | `hooks/useAuth.ts`: `login()` llama `getUserProfile` + `setUser` + `setLoading(false)` directamente sin esperar `onAuthStateChange` |
| Splash Android 12+ logo diminuto | Logo aparece como ícono de ~40px en pantalla | `expo-splash-screen v31` usa API nativa del SO: imagen cuadrada 1024×1024 + `imageWidth: 350` en plugin; requiere nuevo build |

### Cuentas de usuario en DB
- `e5073812...` → dineroleo8@gmail.com ("Daniel Ramos")
- `24ed50f3...` → dineroleoayd48@gmail.com ("daniel") ← cuenta activa en el teléfono

### Notas operativas Supabase
- Rate limit de emails: 3/hora en plan free. Para desarrollo, desactivar "Confirm email" en Auth → Providers → Email
- `Service role key` bloqueada desde entornos externos — usar SQL Editor del dashboard para queries admin
- Para ver emails de usuarios: `SELECT u.full_name, a.email FROM public.users u JOIN auth.users a ON a.id = u.id`
- Variables de entorno EAS están en environment "production" como tipo "secret" — tienen prioridad sobre `.env` local
- Para cambiar clave: `eas env:update production --variable-name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "clave" --visibility secret --non-interactive`

### Notas operativas — Splash Screen (Android)
- `expo-splash-screen v31` (SDK 54) en Android 12+ usa la API nativa del SO: muestra un ícono centrado, NO imagen de pantalla completa
- La imagen debe ser **cuadrada** (1024×1024) con el logo ocupando ~50–60% del frame
- `imageWidth: 350` en el plugin controla el tamaño del ícono en dp (~88% del ancho en teléfonos estándar)
- `resizeMode: "contain"` es correcto para imagen cuadrada en contenedor cuadrado
- Regenerar imágenes: `node scripts/generate-logo.js`
- Todo cambio de splash requiere **nueva build nativa** — no se puede aplicar por OTA

### Comandos clave
```bash
# Nuevo build APK standalone
eas build --platform android --profile preview

# Desplegar Edge Function
SUPABASE_ACCESS_TOKEN=<token> npx supabase functions deploy send-notification --project-ref msokvacqoptnanyamyoc

# Recargar caché PostgREST (ejecutar en SQL Editor de Supabase)
NOTIFY pgrst, 'reload schema';

# SQL via Management API (desde Node.js con config.js en raíz)
node -e "const {ACCESS_TOKEN,PROJECT_REF}=require('./config.js'); fetch('https://api.supabase.com/v1/projects/'+PROJECT_REF+'/database/query',{method:'POST',headers:{'Authorization':'Bearer '+ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query:'SELECT 1'})}).then(r=>r.json()).then(console.log)"
```

---

## Reglas y Convenciones

### TypeScript
- `strict: true` siempre. Cero `any` explícitos; usar `unknown` si el tipo es opaco
- Props de componentes tipadas con `interface`, no `type` (para que sean extensibles)
- Tipos del esquema Supabase en `types/database.ts`; importar desde ahí, no redefinir

### Arquitectura
- **Pantallas** (`app/`): solo orquestación. Llaman hooks, renderizan componentes. Sin lógica de negocio
- **Hooks** (`hooks/`): encapsulan lógica de UI y coordinan servicios. Máximo un nivel de abstracción sobre `services/`
- **Servicios** (`services/`): llamadas a Supabase y APIs externas. Sin estado, sin UI. Exportan funciones puras o promesas
- **Store** (`store/`): solo estado global que vive entre pantallas. No duplicar estado que ya tiene Supabase

### Nombrado
- Componentes: `PascalCase` (`MemberCard.tsx`)
- Hooks: `camelCase` con prefijo `use` (`useJourney.ts`)
- Funciones y variables: `camelCase`
- Constantes globales: `UPPER_SNAKE_CASE`
- Archivos de ruta (Expo Router): `kebab-case` (`forgot-password.tsx`)

### UX obligatorio
- Toda pantalla que carga datos: mostrar `Skeleton` mientras carga, estado de error con retry, estado vacío con mensaje y CTA
- Toda acción destructiva o irreversible: confirmación explícita del usuario
- GPS: solicitar permiso con `Location.requestForegroundPermissionsAsync()` antes de cualquier lectura; manejar rechazo con mensaje de usuario
- SOS: nunca activar sin pasar por `SOSConfirmModal` con cuenta regresiva

### Textos
- Cero strings hardcodeados en componentes o pantallas
- Todos los textos visibles al usuario en `constants/strings.ts`, exportados como objeto tipado
- Considerar internacionalización futura: usar keys descriptivas (`STRINGS.HOME.JOURNEY_START_BUTTON`)

### Seguridad
- RLS activo en todas las tablas; nunca deshabilitar para simplificar una query
- La ubicación GPS de fin de jornada solo se expone a capitanes vía policy de Supabase, no filtrado en cliente
- Los tokens de invitación expiran; validar `expires_at` en el servidor (Edge Function o policy), no solo en cliente
- El `SUPABASE_SERVICE_ROLE_KEY` solo en Edge Functions; nunca en el bundle del cliente

### Git
- Commits en inglés, formato: `type(scope): descripción` (ej. `feat(sos): add countdown confirmation modal`)
- Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`
- Ramas: `feature/nombre-feature`, `fix/nombre-bug`
