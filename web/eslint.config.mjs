// ESLint flat config (ESLint 9 + Next.js 16).
//
// Next 16 removed the built-in `next lint` command, so we run the ESLint CLI
// directly (see package.json `lint`). `eslint-config-next/core-web-vitals`
// ships as a flat-config array that bundles the Next, React and
// accessibility rules the project relied on before.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  {
    rules: {
      // Next 16 bundles the React-Compiler-aware react-hooks plugin, which
      // flags every setState-in-effect as a hard error. Our uses are the
      // deliberate, correct SSR patterns this rule warns broadly about:
      // mount-time hydration reconciliation (`setMounted(true)`), client-only
      // clock init (`setNow(new Date())`), and resetting the typing animation
      // when the language changes. Keep the signal as a warning rather than
      // failing the build on intentional, non-buggy code.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
