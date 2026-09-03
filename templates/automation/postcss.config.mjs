import stylexBabel from "@stylexjs/babel-plugin";
import stylexPostcss from "@stylexjs/postcss-plugin";

// The PostCSS plugin runs Babel over the include globs and emits the compiled atomic CSS where
// `@stylex;` appears (src/stylex.css). It does NOT auto-add the StyleX babel plugin, so we give it an
// explicit babelConfig: @babel/preset-typescript to parse TS/TSX, and @stylexjs/babel-plugin to extract
// the styles. The StyleX runtime in the JS resolves stylex.props() to the same deterministic classes.
const moduleSystem = { type: "commonJS", rootDir: import.meta.dirname };

export default {
  plugins: [
    stylexPostcss({
      include: ["src/**/*.{ts,tsx}"],
      useCSSLayers: false,
      babelConfig: {
        babelrc: false,
        presets: [["@babel/preset-typescript", { isTSX: true, allExtensions: true }]],
        plugins: [[stylexBabel, { unstable_moduleResolution: moduleSystem }]],
      },
    }),
  ],
};
