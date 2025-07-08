import { defineConfig } from "$fresh/server.ts";
import tailwindPlugin from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [tailwindPlugin()],
  build: {
    target: ["chrome88", "firefox78", "safari14", "edge88"],
  },
  server: {
    hostname: "0.0.0.0",
    port: 8000,
  },
});
