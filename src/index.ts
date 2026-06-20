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

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

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
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
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
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Users found" },
          "404": { description: "No users found" },
        },
      },
      delete: {
        tags: ["User"],
        summary: "Delete user metadata from database",
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Successfully deleted" },
          "404": { description: "User not found" },
        },
      },
      patch: {
        tags: ["User"],
        summary: "Update user data",
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
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
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
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
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Deleted successfully" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/q/{id}": {
      get: {
        tags: ["Image"],
        summary: "Stream image directly (use as <img> src)",
        description:
          "Returns the raw image binary from Google Drive. Use this URL directly as the `src` of an `<img>` tag. " +
          "By default returns the optimized WebP version. Add `?original=true` to get the original file.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Public imageId (from image metadata)",
          },
          {
            name: "original",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description:
              "Set to true to stream the original (non-optimized) version",
          },
        ],
        responses: {
          "200": {
            description: "Image binary stream",
            content: {
              "image/webp": { schema: { type: "string", format: "binary" } },
              "image/jpeg": { schema: { type: "string", format: "binary" } },
              "image/png": { schema: { type: "string", format: "binary" } },
            },
          },
          "404": { description: "Image not found" },
          "502": { description: "Failed to stream from Google Drive" },
        },
      },
    },
    "/image/create": {
      post: {
        tags: ["Image"],
        summary: "Create image metadata to database",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  imageId: {
                    type: "string",
                    description: "Original GDrive file ID",
                  },
                  optimizedImageId: {
                    type: "string",
                    description: "Optimized GDrive file ID",
                  },
                  context: {
                    type: "object",
                    properties: {
                      author: { type: "string" },
                      mimetype: { type: "string" },
                    },
                    required: ["author", "mimetype"],
                  },
                },
                required: ["title", "imageId", "optimizedImageId", "context"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Image metadata created" },
          "400": { description: "Bad request" },
          "404": { description: "Author not found" },
        },
      },
    },
    "/image/delete/{id}": {
      delete: {
        tags: ["Image"],
        summary: "Soft delete image metadata by public imageId",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Public imageId",
          },
        ],
        responses: {
          "200": { description: "Successfully deleted" },
          "404": { description: "Image not found" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/image/update/{id}": {
      patch: {
        tags: ["Image"],
        summary: "Update image metadata (title, context) by public imageId",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Public imageId",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  context: {
                    type: "object",
                    properties: {
                      author: { type: "string" },
                      mimetype: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Successfully updated" },
          "404": { description: "Image not found" },
          "400": { description: "No fields to update / bad request" },
        },
      },
    },
    "/image/user/{username}": {
      get: {
        tags: ["Image"],
        summary: "Get all images by author username",
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Images found" },
          "404": { description: "User or images not found" },
          "400": { description: "Bad request" },
        },
      },
    },
  },
  components: {},
};

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Zxifile API Docs",
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  }),
);

// Mount all routes
app.use("/", router);

export { app };
