const t = require('@babel/types')
const parser = require('@babel/parser')
const generator = require('@babel/generator')
const Util = require('../util/util')
const WidgetImport = require('./widgetImport')
const fs = require('fs-extra')
const path = require('path')

class Widget {
  constructor(filePath) {
    this.filePath = filePath
    this._tree = null
    this.codeProgram = null
  }

  async init() {
    this._tree = await this.getTree()
    const wimpt = new WidgetImport(this._tree)
    await wimpt.init()
    const importList = wimpt.getImportList()
    const loadExpression = wimpt.getLoadExpression()

    const codeBodyList = await this.getBody()
    const code = t.blockStatement([loadExpression].concat(codeBodyList))
    const loadFunVar = t.variableDeclaration('const', [
      t.variableDeclarator(t.identifier('load'), t.functionExpression(
        null, 
        [],
        code
      ))
    ])
    const program = t.program(importList.concat(loadFunVar))
    this.codeProgram = program
    return program
  }

  getCode() {
    if(this.codeProgram) {
      return generator.default(this.codeProgram).code
    }
  }

  async getTree() {
    if(this.filePath && fs.pathExistsSync(this.filePath)) {
      const content = await fs.readFile(this.filePath)
      const ast = parser.parse(content.toString())
      return ast
    }
  }

  async getBody() {
    const defineNode = await Util.findFirstNode(this._tree, (node) => {
      return t.isCallExpression(node) && node.callee.name === 'define' && node.arguments.length === 2
    })
    if(defineNode && t.isFunctionExpression(defineNode.arguments[1])) {
      const codeBody = defineNode.arguments[1].body
      const codeDeclare = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('mo'), t.arrowFunctionExpression([], codeBody))
      ])
      const returnDeclare = t.returnStatement(t.newExpression(
        t.identifier('mo'),
        []
      ))
      return [codeDeclare, returnDeclare]
    }
  }

}

module.exports = Widget
