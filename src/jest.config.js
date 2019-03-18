module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
  modulePathIgnorePatterns: ["<rootDir>/lib/"]
};
