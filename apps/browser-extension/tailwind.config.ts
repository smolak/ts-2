import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class", "[data-theme='dark']"],
  content: ["./src/**/*.tsx", "../../packages/*/src/**/*.tsx"],
} satisfies Config

export default config
