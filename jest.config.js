const path = require("path");

module.exports = {
  collectCoverageFrom: ["**/*.{ts,tsx}", "!**/node_modules/**", "!**/*test*"],
  moduleNameMapper: {
    "^lodash-es$": "lodash",
  },
  roots: ["<rootDir>"],
  testMatch: [path.join("<rootDir>", "**", "*.(test|spec).(js|jsx|ts|tsx)")],
  testEnvironment: "node",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.tsx?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules"],
  verbose: true,
};
