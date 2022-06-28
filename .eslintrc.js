module.exports = {
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  ignorePatterns: [
    "*.js",
  ],
  "rules": {
    "@typescript-eslint/triple-slash-reference":"off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-unused-vars":"off",
    "no-unused-vars": ['warn', { 'argsIgnorePattern': '.*' }],
    // allow that = this
    "@typescript-eslint/no-this-alias": [
      "error",
      {
        "allowDestructuring": true, // Allow `const { props, state } = this`; false by default
        "allowedNames": ["that"] // Allow `const that= this`; `[]` by default
      }
    ],

    // allow empty arrow functions, e.g. ml.UI.addDropdownToValue(something, "Select", options, "w1", weights, false, false, () => { });
    "@typescript-eslint/no-empty-function":["error",  { 'allow': ["arrowFunctions"] }],
    "no-self-assign":"off" // allow stuff like window.location.href = window.location.href
  }


  
}
