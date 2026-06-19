import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import router from "./router";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

/**
 * Application
 */
const app = express();

// Security headers (replaces elysia-helmet)
app.use(helmet());

// CORS settings (replaces @elysiajs/cors)
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Rate limiting (replaces elysia-rate-limit)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Parse cookies (for JWT auth cookie)
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Swagger docs (replaces @elysiajs/swagger)
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Zxifile Documentation",
    version: "1.0.0",
    description:
      "This is documentation about Zxifile endpoint for easier other developer to use this service",
    contact: {
      name: "CrzxaExe",
    },
  },
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "User", description: "User management endpoints" },
    { name: "Image", description: "Image metadata endpoints" },
    { name: "Drive", description: "Google Drive endpoints" },
  ],
  paths: {
    "/": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        deprecated: true,
        summary: "Registering new account",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
                required: ["username", "email", "password"],
              },
            },
          },
        },
        responses: {
          "302": { description: "Redirecting to login page" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "302": { description: "Redirect to dashboard" },
          "404": { description: "Email not found" },
          "406": { description: "Password dont match" },
        },
      },
    },
    "/user": {
      post: {
        tags: ["User"],
        summary: "Create user metadata to database",
        requestBody: {
          content: {
            "application/json": {
              example: {
                username: "CrzxaExe3",
                email: "example@gmail.com",
                password: "crzxaexe3",
              },
            },
          },
        },
        responses: {
          "200": { description: "Successfully created" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/user/id/{id}": {
      get: {
        tags: ["User"],
        summary: "Get user metadata from database by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User found" },
          "404": { description: "User not found" },
        },
      },
    },
    "/user/{username}": {
      get: {
        tags: ["User"],
        summary: "Search users by username",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Users found" },
          "404": { description: "No users found" },
        },
      },
      delete: {
        tags: ["User"],
        summary: "Delete user metadata from database",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successfully deleted" },
          "404": { description: "User not found" },
        },
      },
      patch: {
        tags: ["User"],
        summary: "Update user data",
        parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successfully updated" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/drive/upload": {
      post: {
        tags: ["Drive"],
        summary: "Upload image(s) to Google Drive",
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: { type: "array", items: { type: "string", format: "binary" } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Uploaded successfully" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/drive/delete/{id}": {
      delete: {
        tags: ["Drive"],
        summary: "Delete image from Google Drive",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted successfully" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/image/create": {
      post: {
        tags: ["Image"],
        summary: "Create image metadata to database",
        responses: {
          "200": { description: "Image metadata created" },
          "400": { description: "Bad request" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "auth",
      },
    },
  },
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Zxifile API Docs",
  swaggerOptions: {
    defaultModelsExpandDepth: -1,
  },
}));

// Mount all routes
app.use("/", router);

export { app };
