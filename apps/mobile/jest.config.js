// pnpm-compatible transformIgnorePatterns
// The pnpm virtual store places packages at node_modules/.pnpm/<pkg+ver>/node_modules/<pkg>/
// We need to handle both that path structure and the standard node_modules/<pkg>/ structure.
const ALLOW_LIST = [
  "(jest-)?react-native",
  "@react-native(-community)?",
  "@react-native/",
  "expo(nent)?",
  "@expo(nent)?/",
  "@expo-google-fonts/",
  "react-navigation",
  "@react-navigation/",
  "@unimodules/",
  "unimodules",
  "sentry-expo",
  "native-base",
  "react-native-svg",
  "lucide-react-native",
  "@estoicismo/",
].join("|");

module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    // Handle pnpm .pnpm virtual store paths
    `node_modules/\\.pnpm/.*?/node_modules/(?!(${ALLOW_LIST}))`,
    // Handle standard node_modules paths (exclude .pnpm itself from ignore)
    `node_modules/(?!(\\.pnpm/|${ALLOW_LIST}))`,
  ],
  moduleNameMapper: {
    "^react-native-purchases$": "<rootDir>/__mocks__/react-native-purchases.ts",
  },
};
