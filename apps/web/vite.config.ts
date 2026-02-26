import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    // 1. Force binding to 0.0.0.0 so Railway can reach the container
    host: "0.0.0.0",
    // 2. Use Railway's dynamic PORT or fallback to 3001
    port: Number.parseInt(process.env.PORT || "3001", 10),
  },
});
