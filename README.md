# Zxifile Backend (Express)

Backend API untuk Zxifile menggunakan **Express.js** + **TypeScript** + **MongoDB**, dikonversi dari versi Elysia.

## Tech Stack

| Elysia (original) | Express (this repo) |
|---|---|
| `elysia` | `express` |
| `@elysiajs/cors` | `cors` |
| `elysia-helmet` | `helmet` |
| `@elysiajs/jwt` | `jsonwebtoken` |
| `elysia-rate-limit` | `express-rate-limit` |
| `@elysiajs/swagger` | `swagger-ui-express` |
| `@elysiajs/node` | _(native Node.js)_ |
| `@yolk-oss/elysia-env` | `dotenv` + manual validation |
| `t.Files()` body validation | `multer` |
| Bun runtime | Node.js runtime |

## Project Structure

```
backend-express/
├── index.ts                  # Entry point
├── src/
│   ├── index.ts              # Express app setup
│   ├── router/
│   │   ├── index.ts          # Route aggregator
│   │   ├── auth.ts           # Auth routes (register, login)
│   │   ├── user.ts           # User CRUD routes
│   │   ├── image.ts          # Image metadata routes
│   │   └── drive.ts          # Google Drive upload/delete (protected)
│   ├── middleware/
│   │   ├── logging.ts        # Request logger
│   │   └── authentication.ts # JWT cookie auth guard
│   ├── services/
│   │   ├── GDrive.ts         # Google Drive API wrapper
│   │   └── Editor.ts         # Sharp image optimizer
│   ├── utils/
│   │   ├── Database.ts       # MongoDB wrapper
│   │   ├── Terminal.ts       # Chalk logger
│   │   └── Generator.ts      # Random ID generator
│   └── types/
│       └── Schema-Type.ts    # TypeScript types (User, Image, Entities)
├── package.json
├── tsconfig.json
└── .env
```

## Environment Variables

Copy `.env` and fill in your values:

```env
APP_NAME="Zxifile"
PORT=3000
FRONTEND_URL="http://localhost:3000"
MONGO_URI="mongodb+srv://..."
DRIVE_CLIENT="..."
DRIVE_SECRET="..."
DRIVE_REFRESH_TOKEN="..."
JWT_SECRET="your-secure-secret"
ALLOWED_ORIGINS="http://localhost:5173"
```

## Getting Started

```bash
# Install dependencies
npm install

# Development (auto-reload)
npm run dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/` | Health check | No |
| POST | `/auth/register` | Register account _(deprecated)_ | No |
| POST | `/auth/login` | Login, sets `auth` cookie | No |
| POST | `/user` | Create user | No |
| GET | `/user/id/:id` | Get user by ObjectId | No |
| GET | `/user/:username` | Search users by username | No |
| DELETE | `/user/:id` | Soft-delete user | No |
| PATCH | `/user/:id` | Update user | No |
| POST | `/drive/upload` | Upload image(s) to GDrive | ✅ Cookie JWT |
| DELETE | `/drive/delete/:id` | Delete image from GDrive | ✅ Cookie JWT |
| POST | `/image/create` | Create image metadata | No |
| DELETE | `/image/delete/:id` | Delete image metadata | No |
| PATCH | `/image/update/:id` | Update image metadata | No |

## Docs

Swagger UI tersedia di: `http://localhost:3000/docs`
