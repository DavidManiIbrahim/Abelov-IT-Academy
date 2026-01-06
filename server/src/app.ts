import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { connectMongo, mongoState } from "./db/mongo";
import { httpLogger } from "./middlewares/logger";
import { apiRateLimiter } from "./middlewares/rateLimit";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error";
import { swaggerSpec } from "./docs/swagger";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Trust first proxy (Render load balancer)

  app.use(httpLogger);
  app.use(helmet());

  // Production-ready CORS configuration
  const allowedOrigins = [
    // Production frontend (Render deployment)
    "https://abelov-hub-records.onrender.com",
    // Development frontend
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  // CORS middleware with proper credentials handling
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);

        // Check against allowed origins
        const isAllowed = allowedOrigins.includes(origin) || origin.includes('localhost');

        if (isAllowed) {
          return callback(null, origin);
        }

        return callback(new Error("CORS policy violation"));

      },
      credentials: true, // This combined with origin: true reflects the request origin
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-CSRF-Token"
      ],
      optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), version: "1.0.0", db: mongoState() });
  });

  app.use("/api", apiRateLimiter);
  app.use("/api/v1", apiRoutes);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
