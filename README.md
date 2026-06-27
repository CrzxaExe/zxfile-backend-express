# Zxifile Backend

Backend API untuk Zxifile menggunakan **Express.js** + **TypeScript** + **MongoDB**.

## Project Structure

```
backend-express/
├── index.ts                  # Entry point
├── src/
│   ├── index.ts              # Express app setup
│   ├── router/
│   │   ├── index.ts          # Route aggregator
│   │   ├── admininstrator.ts # Admin routes
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

| Method | Path                       | Description                     | Auth            |
| ------ | -------------------------- | ------------------------------- | --------------- |
| GET    | `/`                        | Health check                    | No              |
| POST   | `/auth/register`           | Register account _(deprecated)_ | No              |
| POST   | `/auth/login`              | Login, sets `auth` cookie       | No              |
| POST   | `/user`                    | Create user                     | No              |
| GET    | `/user/id/:id`             | Get user by ObjectId            | No              |
| GET    | `/user/:username`          | Search users by username        | No              |
| DELETE | `/user/:id`                | Soft-delete user                | ✅ Cookie JWT   |
| PATCH  | `/user/`                   | Update user                     | ✅ Cookie JWT   |
| POST   | `/drive/upload`            | Upload image(s) to GDrive       | ✅ Cookie JWT   |
| DELETE | `/drive/delete/:id`        | Soft delete image from GDrive   | ✅ Cookie JWT   |
| POST   | `/image/create`            | Create image metadata           | ✅ Cookie JWT   |
| DELETE | `/image/delete/:id`        | Delete image metadata           | ✅ Cookie JWT   |
| PATCH  | `/image/update/:id`        | Update image metadata           | ✅ Cookie JWT   |
| GET    | `/image/dashboard`         | Get user dashboard              | ✅ Cookie JWT   |
| GET    | `/image/explore`           | Get latest uploaded images      | No              |
| DELETE | `/admin/image/delete/:key` | Hard delete all deleted images  | Application Key |

## Docs

Swagger UI tersedia di: `http://localhost:3000/docs`
