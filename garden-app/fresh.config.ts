import { defineConfig } from "$fresh/server.ts";
import tailwindPlugin from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [tailwindPlugin()],
});
