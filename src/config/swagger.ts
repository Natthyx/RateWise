import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RateWise API Documentation",
      version: "1.0.0",
      description:
        "API documentation for the RateWise System (Admin, Staff, Services, Sessions, and Analytics).",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development Server",
      },
      {
        url: "https://rately-smw9.onrender.com",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"], // <-- Add routes for automatic scanning
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
