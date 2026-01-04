# FeedGym 💪

Una red social tipo feed para la comunidad fitness, inspirada en X.com (Twitter).

## Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS + shadcn/ui
- **Autenticación**: NextAuth.js v5 (Auth.js)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Gráficos**: Recharts

## Características

### MVP (Implementado)
- ✅ Registro/Login con email y contraseña
- ✅ Feed principal con posts cronológicos
- ✅ Crear posts con tipos (Workout, PR, Progress, Meal, Note)
- ✅ Metadata fitness (ejercicio, series, reps, peso, RPE)
- ✅ Likes y bookmarks
- ✅ Replies a posts
- ✅ Perfiles de usuario con stats
- ✅ Gráfico de peso corporal
- ✅ Búsqueda de usuarios y posts
- ✅ Notificaciones in-app
- ✅ Settings (perfil, apariencia, privacidad, seguridad)
- ✅ Dark mode
- ✅ Diseño responsive (mobile + desktop)

### Por Implementar (V1)
- [ ] Threads (hilos de múltiples posts)
- [ ] Repost y Quote
- [ ] Follow/Unfollow funcional
- [ ] Upload de imágenes (Supabase Storage)
- [ ] Personal Records (PRs) gestionables
- [ ] 2FA
- [ ] Email notifications

## Instalación

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL (local o Supabase/Neon)
- npm o yarn

### Pasos

1. **Instalar dependencias**
```bash
cd feedgym
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus valores:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/feedgym"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"
```

Para generar un secret:
```bash
openssl rand -base64 32
```

3. **Configurar base de datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## Estructura del Proyecto

```
feedgym/
├── prisma/
│   └── schema.prisma          # Modelo de datos
├── src/
│   ├── app/
│   │   ├── (auth)/            # Rutas de autenticación
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # Rutas principales (protegidas)
│   │   │   ├── page.tsx       # Feed principal
│   │   │   ├── [username]/    # Perfil de usuario
│   │   │   ├── post/[id]/     # Detalle de post
│   │   │   ├── notifications/
│   │   │   ├── bookmarks/
│   │   │   ├── search/
│   │   │   └── settings/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── posts/
│   │   │   ├── users/
│   │   │   ├── weight/
│   │   │   ├── notifications/
│   │   │   └── search/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── layout/            # Sidebar, Header, MobileNav
│   │   ├── post/              # PostCard, Composer
│   │   ├── profile/           # ProfileHeader, WeightChart
│   │   └── providers/
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma client
│   │   ├── utils.ts           # Utilities
│   │   └── validations.ts     # Zod schemas
│   ├── hooks/
│   └── types/
├── package.json
├── tailwind.config.ts
└── next.config.js
```

## API Endpoints

### Auth
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### Posts
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/posts` | Obtener feed |
| POST | `/api/posts` | Crear post |
| GET | `/api/posts/[id]` | Detalle de post |
| DELETE | `/api/posts/[id]` | Eliminar post |
| POST | `/api/posts/[id]/like` | Toggle like |
| POST | `/api/posts/[id]/bookmark` | Toggle bookmark |

### Users
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users/[username]` | Perfil público |
| GET | `/api/users/me` | Usuario actual |
| PATCH | `/api/users/me` | Actualizar perfil |
| POST | `/api/users/[username]/follow` | Toggle follow |

### Weight
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/weight` | Historial de peso |
| POST | `/api/weight` | Registrar peso |

### Others
| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications` | Notificaciones |
| PATCH | `/api/notifications` | Marcar como leídas |
| GET | `/api/bookmarks` | Posts guardados |
| GET | `/api/search` | Buscar usuarios/posts |

## Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Iniciar producción
npm run lint         # Linting
npm run db:generate  # Generar Prisma client
npm run db:push      # Sync schema con DB
npm run db:migrate   # Crear migración
npm run db:studio    # Abrir Prisma Studio
```

## Deploy

### Vercel (Recomendado)

1. Push a GitHub
2. Conectar repo en Vercel
3. Configurar variables de entorno:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

### Base de Datos

Opciones recomendadas:
- **Supabase** (gratis, incluye storage)
- **Neon** (gratis, serverless)
- **Railway** (incluye PostgreSQL)

## Licencia

MIT
