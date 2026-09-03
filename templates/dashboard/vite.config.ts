import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import stylexBabel from "@stylexjs/babel-plugin";

// StyleX is compiled in two coordinated passes that MUST share the same module resolution so their
// atomic-class + CSS-variable hashes line up exactly:
//  1. here — the babel plugin (via @vitejs/plugin-react) rewrites stylex.props() to literal class names
//     and strips the runtime (runtimeInjection:false);
//  2. postcss.config.mjs — @stylexjs/postcss-plugin emits the matching atomic CSS at `@stylex;`.
const moduleSystem = { type: "commonJS" as const, rootDir: import.meta.dirname };

export default defineConfig({
  // Relative asset paths so the built bundle serves from R2 under ANY host (the the install zone + versioned
  // preview requirement) — never an absolute "/" base.
  base: "./",
  plugins: [
    react({
      babel: {
        plugins: [[stylexBabel, { dev: false, runtimeInjection: false, treeshakeCompensation: true, unstable_moduleResolution: moduleSystem }]],
      },
    }),
  ],
  build: { outDir: "dist", target: "es2022", sourcemap: false },
});
