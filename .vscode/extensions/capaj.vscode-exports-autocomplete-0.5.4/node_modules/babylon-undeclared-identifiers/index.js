'use strict'
const babylon = require('babylon')
const traverse = require('babel-traverse').default

module.exports = (sourceCode) => {
  const ast = babylon.parse(sourceCode, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow'
    ]
  })
  let globals = []

  traverse(ast, {
    Program: (path) => {
      globals = Object.keys(path.scope.globals)
    }
  })
  return globals
}
