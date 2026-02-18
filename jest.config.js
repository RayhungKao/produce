const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Handle module aliases (if you have any in jsconfig.json)
    "^@/(.*)$": "<rootDir>/src/$1",
    // Handle CSS imports (with CSS modules)
    "\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/produce/",
    "<rootDir>/src/__tests__/test-utils.js",
  ],
  modulePathIgnorePatterns: ["<rootDir>/produce/"],
  collectCoverageFrom: [
    // Focus on Image Converter feature for coverage
    "src/components/features/image-converter/**/*.{js,jsx}",
    // Exclude test files
    "!src/**/*.test.{js,jsx}",
    "!src/__tests__/**",
    // Exclude static/documentation components
    "!src/components/features/image-converter/components/tech-explanation/**",
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 45,
      lines: 55,
      statements: 55,
    },
    // Higher threshold for core utilities
    "src/components/features/image-converter/utils/*.js": {
      branches: 50,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
