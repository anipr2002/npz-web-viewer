import { defineApp } from "convex/server";
import polar from "@convex-dev/polar/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp();
app.use(polar);
app.use(rateLimiter);

export default app;
