const t = require('@babel/types')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator')
const Util = require('../util/util')
const WidgetImport = require('./widgetImport')
const WidgetTemplate = require('./widgetTemplate')
const WidgetNls = require('./widgetNls')
const fs = require('fs-extra')
const path = require('path')

const MODULE_NAME = 'mo'
const TEMPLATE_VAR_NAME = "HTML_TEMPLATE"

class Widget {
  constructor(filePath) {
    this.filePath = filePath
    this.basename = path.basename(filePath, '.js').replace(/-/g, '_')
    this._tree = null
    this.codeProgram = null
    this.dependencies = []
    this.wimpt = null
    this.wtemp = null
  }

  async init() {
    this._tree = await this.getTree()
    const wimpt = this.wimpt = new WidgetImport(this._tree)
    await wimpt.init()
    const wtemp = this.wtemp = new WidgetTemplate(this._tree, this.filePath)
    await wtemp.init()
    // 设置模块中html模板的属性
    await wtemp.append2Tree(this._tree)
    const importList = wimpt.getImportList()
    const loadExpression = wimpt.getLoadExpression()
    if(loadExpression) {
      t.addComment(loadExpression, 'leading', '加载dojo模块')
    }
    // 需要import的依赖，用于将依赖也转换过来
    this.dependencies = wimpt.importList || []
    const codeBodyList = await this.getBody()
    const code = t.blockStatement((loadExpression ? [loadExpression] : []).concat(codeBodyList))

    // 处理import导入的模块，需要先把模块异步导入进来
    const asyncLoadeList = []
    for(let item of importList.filter(i => {
      let _value = i.source.value
      return !_value.startsWith('@arcgis/core')
    })) {
      if(item.source.value.toLowerCase() === 'esri-loader' && item.specifiers.length >= 1) {
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
    // 设置html模板内容
    if(wtemp.templateString) {
      const templateNode = wtemp.buildTemplateNode()
      code.body.splice(asyncLoadeList.length, 0, templateNode)
    }
    // 加入NLS内容
    const wnls = new WidgetNls(this.filePath)
    const nlsNode = await wnls.getContentNode()
    if(nlsNode) {
      code.body.splice(asyncLoadeList.length, 0, nlsNode)
    }
    // 组织类型节点
    const classNode = this.buildClass(code)
    t.addComment(classNode, 'leading', 'dojo模块包装类，因为异步的原因，需要通过包装类的静态方法来获取模块的类型或者实例', false)
    const exportNode = t.exportDefaultDeclaration(t.identifier(this.basename))
    const file = t.file(t.program(importList.concat(classNode, exportNode)))
    await this.dealAfter(file)
    this.codeProgram = file
    // 禁用eslint检查
    t.addComment(file, 'leading', 'eslint-disable')
    return file
  }

  getCode() {
    if(this.codeProgram) {
      return generator.default(this.codeProgram).code
    }
  }
  // 组织主体代码的类
  buildClass(code) {
    // 创建一个获取dojo模块（class）的方法
    const getClassFun = t.classMethod('method',
      t.identifier('getClass'),
      [],
      code, false, true, false, true)
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
      code4create, false, true, false, true)
    t.addComment(createFun, 'leading', '获取模块实例')
    return t.classDeclaration(t.identifier(this.basename), null, t.classBody([getClassFun, createFun]),[])
  }
  // 获取语法树
  async getTree() {
    if(this.filePath && fs.pathExistsSync(this.filePath)) {
      // const content = await fs.readFile(this.filePath)
      // const ast = parser.parse(content.toString())
      const ast = parser.parse(Util.readFileSync(this.filePath))
      return ast
    }
  }

  // 获取主体函数部分
  async getBody() {
    const defineNode = await Util.findDefineNode(this._tree)
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
      const returnDeclare = t.returnStatement(t.callExpression(
        t.identifier(MODULE_NAME), []
      ))
      return [codeDeclare, returnDeclare]
    }
  }

  // 遍历ast树，处理生成后的代码树
  async dealAfter(tree) {
    // 准备函数
    const prepareFun = () => {
      return new Promise(resolve => {
        const addImportList = []
        traverse(tree, {
          enter(path) {
            // this.inherited(arguments) 处理
            if(t.isIdentifier(path.node, {name: 'inherited'}) && t.isMemberExpression(path.parent) && t.isThisExpression(path.parent.object)) {
              // this.inherited(arguments) 改成 inherited(arguments)
              const rowPath = path.findParent(pPath => pPath.isExpressionStatement(pPath.node))
              rowPath && rowPath.replaceWith(
                t.expressionStatement(
                  t.callExpression(t.identifier('inherited'), [t.identifier('arguments')])
                )
              )
              // 
              const funPath = path.findParent(pPath => pPath.isObjectMethod() || pPath.isObjectProperty())
              funPath && funPath.replaceWith(
                t.objectProperty(funPath.node.key, t.callExpression(
                  t.memberExpression(t.identifier('common'), t.identifier('dojoInheritedProxy')), 
                  [
                    t.functionExpression(null, [t.identifier('inherited')], funPath.node.body || funPath.node.value.body)
                  ]
                ))
              )
              addImportList.push({
                source: '@/comm/utils',
                specifiers: ['common']
              })
            }
            // require 转成 window.require
            if(path.isIdentifier({name: 'require'}) && t.isMemberExpression(path.parent) && path.node === path.parent.object) {
              path.parent.object = t.memberExpression(t.identifier('window'), t.identifier('require'))
            }
            // 
          },
          exit(path) {
            if(path.isProgram()) {
              resolve({
                addImportList
              })
            }
          }
        })
      })
    }

    const res = await prepareFun()
    if(res.addImportList.length > 0) {
      for(let item of res.addImportList) {
        await WidgetImport.addImport(tree, item.source, item.specifiers)
      }
    }
  }

}

module.exports = Widget
