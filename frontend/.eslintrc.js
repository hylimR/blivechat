module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: "@babel/eslint-parser",
  },
  extends: ["plugin:vue/essential", "eslint:recommended"],
  rules: {
    "no-shadow": "warn", // 变量名和外部作用域重复

    "no-console": "off", // 线上尽量不要用console输出，看不到的

    "vue/multi-word-component-names": "off", // Vue组件名允许用1个单词,
  },
};
