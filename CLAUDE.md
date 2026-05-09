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

### 4. Botón 1 — Inicio de Jornada
- El miembro pulsa "Iniciar jornada"
- Se registra en `reports` con `type: 'start'`, timestamp y user_id
- Se envía notificación push a **todos los miembros del grupo**: `"{Nombre} ha iniciado su jornada"`
- Solo puede haber un `start` activo por usuario por día

### 5. Botón 2 — Fin de Jornada
- El miembro pulsa "Finalizar jornada"
- Se registra en `reports` con `type: 'end'`, timestamp, user_id y **ubicación GPS**
- Notificación push a **todos los miembros**: `"{Nombre} ha finalizado su jornada"`
- La ubicación GPS se comparte **únicamente con los capitanes** del grupo (RLS + lógica de vista)
- Requiere que exista un `start` activo del mismo día

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

### 8. Notificaciones Push
- Proveedor: **Expo Notifications** para el canal de desarrollo; **Firebase Cloud Messaging** para producción (Android) y APNs (iOS) vía Expo
- Tokens de dispositivo almacenados en `users.expo_push_token`
- Envío desde **Supabase Edge Functions** (TypeScript) para no exponer credenciales en el cliente
- Tipos de notificación: `JOURNEY_START`, `JOURNEY_END`, `ABSENCE_ALERT`, `SOS_ACTIVATED`, `SOS_RESOLVED`

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
| Framework | **React Native + Expo SDK 51+** | Multiplataforma real, ecosistema maduro, OTA updates |
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
│   │   └── forgot-password.tsx       # Recuperación de contraseña
│   │
│   └── (app)/                        # Rutas protegidas (requieren sesión)
│       ├── _layout.tsx               # Verifica sesión; redirige a (auth) si no hay
│       │
│       ├── (tabs)/                   # Navegación principal por tabs
│       │   ├── _layout.tsx           # Configuración de tabs (iconos, labels)
│       │   ├── home.tsx              # Dashboard: botones de jornada, estado del grupo
│       │   ├── group.tsx             # Vista de miembros y estado del grupo
│       │   ├── sos.tsx               # Tab SOS (o botón flotante global)
│       │   └── profile.tsx           # Perfil del usuario, logout
│       │
│       └── group/
│           ├── [id].tsx              # Detalle de un grupo específico
│           ├── create.tsx            # Crear nuevo grupo (solo captains)
│           ├── invite.tsx            # Generar/compartir invitación
│           └── members.tsx           # Gestión de miembros (solo captains)
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
│       ├── JourneyButton.tsx         # Botón de inicio/fin de jornada con estado
│       ├── SOSButton.tsx             # Botón SOS con animación de pulso
│       ├── SOSConfirmModal.tsx       # Modal de confirmación con cuenta regresiva
│       ├── MemberCard.tsx            # Tarjeta de miembro con estado de jornada
│       ├── GroupHeader.tsx           # Encabezado de grupo con info y acciones
│       └── AbsenceAlertModal.tsx     # Modal para enviar alerta de ausencia
│
├── hooks/
│   ├── useAuth.ts                    # Estado de sesión, login, logout, registro
│   ├── useGroup.ts                   # CRUD de grupo, membresía
│   ├── useJourney.ts                 # Lógica de botones 1 y 2, estado del día
│   ├── useSOS.ts                     # Activación, tracking y desactivación de SOS
│   ├── useNotifications.ts           # Registro de token, permisos, listeners
│   └── useLocation.ts               # Solicitud de permisos GPS y obtención de coordenadas
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
│   │   └── sos.ts                    # CRUD de sos_events, suscripción realtime
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
├── .env                              # Variables de entorno locales (nunca al repo)
├── .env.example                      # Plantilla de variables (sí al repo)
├── app.json                          # Configuración de Expo
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

*Índice único en `(group_id, user_id)`.*

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
