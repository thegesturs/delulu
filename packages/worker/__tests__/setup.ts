import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

// No mocking - allow real API calls and console output
// Tests will use real database data and make real HTTP requests
