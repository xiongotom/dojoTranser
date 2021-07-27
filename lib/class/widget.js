const t = require('@babel/types')
const parser = require('@babel/parser')
const generator = require('@babel/generator')
const Util = require('../util/util')
const WidgetImport = require('./widgetImport')
const fs = require('fs-extra')
const path = require('path')

const MODULE_NAME = 'mo'
const LOAD_FUNC_NAME = 'load'

class Widget {
  constructor(filePath) {
    this.filePath = filePath
    this.basename = path.basename(filePath, '.js')
    this._tree = null
    this.codeProgram = null
    this.dependencies = []
  }

  async init() {
    this._tree = await this.getTree()
    const wimpt = new WidgetImport(this._tree)
    await wimpt.init()
    const importList = wimpt.getImportList()
    const loadExpression = wimpt.getLoadExpression()
    if(loadExpression) {
      t.addComment(loadExpression, 'leading', '加载dojo模块')
    }
    // 需要import的依赖，用于将依赖也转换过来
    this.dependencies = wimpt.importList || []
    const codeBodyList = await this.getBody()
    const code = t.blockStatement((loadExpression ? [loadExpression] : []).concat(codeBodyList))
    // const codeBodyList = await this.getBody()
    // const code = t.blockStatement([loadExpression].concat(codeBodyList))
    // const loadFunVar = t.variableDeclaration('const', [
    //   t.variableDeclarator(t.identifier(LOAD_FUNC_NAME), t.functionExpression(
    //     null, 
    //     [],
    //     code, false, true
    //   ))
    // ])
    // t.addComment(loadFunVar, 'leading', '声明一个load函数，用于异步加载该模块')
    // const exportDec = t.exportDefaultDeclaration(t.identifier(LOAD_FUNC_NAME))
    // t.addComment(exportDec, 'leading', '导出模块，需要试用const yy = await xxx.load()来加载，因为加载是异步的')

    // 处理import导入的模块，需要先把模块异步导入进来
    const asyncLoadeList = []
    for(let item of importList.filter(i => !i.source.value.startsWith('esri'))) {
      if(item.source.value.toLowerCase() === 'esri-loader' && item.specifiers.length > 1) {
        continue
      }
      const clzName = item.specifiers[0].local.name
      let clzParamName = item.specifiers[0].local.name = clzName+'Clz'
      // 添加异步加载class的代码
      asyncLoadeList.push(t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(clzName), t.awaitExpression(
          t.callExpression(t.memberExpression(
            t.identifier(clzParamName),
            t.identifier('getClass')
          ), [])
        ))
      ]))
    }
    if(asyncLoadeList.length > 0) {
      code.body.unshift(...asyncLoadeList)
      t.addComment(asyncLoadeList[0], 'leading', '加载经过处理的自定义模块')
    }

    const classNode = this.buildClass(code)
    t.addComment(classNode, 'leading', 'dojo模块包装类，因为异步的原因，需要通过包装类的静态方法来获取模块的类型或者实例', false)
    const exportNode = t.exportDefaultDeclaration(t.identifier(this.basename))
    const program = t.program(importList.concat(classNode, exportNode))
    this.codeProgram = program
    return program
  }

  getCode() {
    if(this.codeProgram) {
      return generator.default(this.codeProgram).code
    }
  }

  buildClass(code) {
    // 创建一个获取dojo模块（class）的方法
    const getClassFun = t.classMethod('method',
      t.identifier('getClass'),
      [],
      code, false, false, false, true)
    t.addComment(getClassFun, 'leading', '获取模块类型')
    // 创建一个获取dojo模块实例(new class())的方法
    const code4create = t.blockStatement([
      t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('clz'), t.awaitExpression(
          t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('getClass')), [])
        ))
      ]),
      t.returnStatement(t.newExpression(t.identifier('clz'), []))
    ])
    const createFun = t.classMethod('method', 
      t.identifier('create'),
      [],
      code4create, false, false, false, true)
    t.addComment(createFun, 'leading', '获取模块实例')
    return t.classDeclaration(t.identifier(this.basename), null, t.classBody([getClassFun, createFun]),[])
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
      return t.isCallExpression(node) && node.callee.name === 'define'
    })
    // const defineNode = this._tree.find(path => {
    //   const node = path.node
    //   return t.isCallExpression(node) && node.callee.name === 'define' && node.arguments.length === 2
    // })
    const funNode = defineNode && defineNode.arguments.find(node => t.isFunctionExpression(node))
    if(defineNode && funNode) {
      const codeBody = funNode.body
      const codeDeclare = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(MODULE_NAME), t.arrowFunctionExpression([], codeBody))
      ])
      t.addComment(codeDeclare, 'leading', '原dojo代码主体')
      const returnDeclare = t.returnStatement(t.newExpression(
        t.identifier(MODULE_NAME),
        []
      ))
      return [codeDeclare, returnDeclare]
    }
  }

}

module.exports = Widget
