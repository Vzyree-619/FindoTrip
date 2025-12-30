// ========================================
// FindoTrip - Health Check Route
// ========================================
// Simple health check endpoint for Docker health monitoring

import { json } from "@remix-run/node";

export async function loader() {
  try {
    // Basic health check - just return success
    // In production, you might want to check database connectivity
    return json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    return json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}
