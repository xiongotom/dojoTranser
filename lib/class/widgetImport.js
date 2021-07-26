const t = require('@babel/types')
const Util = require('../util/util')


const AMD_IMPORT_LIST = [
  'dojo/',
  'dijit/',
  'dojox/'
]

class WidgetImport {
  constructor(ast) {
    this._tree = ast
    this.amdList = []
    this.importList = []
  }
  // 初始化
  async init() {
    const defineNode = await Util.findFirstNode(this._tree, (node) => {
      return t.isCallExpression(node) && node.callee.name === 'define' && node.arguments.length === 2
    })
    if(defineNode) {
      const sourceList = node.arguments[0].elements
      const specifiers = node.arguments[1].arguments
      this.analysis(sourceList, specifiers)
    }
  }
  // 分析，分别找出可以import的和需要用amd方式加载的
  analysis(sourceList, specifiers) {
    let importList = []
    let amdList = []
    for(let i=0; i<sourceList.length; i++) {
      let _obj = {
        source: sourceList[i],
        specifier: i < specifiers.length ? specifiers[i] : null
      }
      if(this.isAmdSource(sourceList[i])) {
        amdList.push(_obj)
      } else {
        importList.push(_obj)
      }
    }
    this.amdList = amdList
    this.importList = importList
  }
  // 获取import的ast节点对象
  getImportList() {
    const _list = this.importList.map(item => {
      const _source = t.stringLiteral(item.source)
      const _spe = t.identifier(item.specifier)
      return t.importDeclaration([t.importDefaultSpecifier(_spe)], _source)
    })
    // 增加对于esri-loader的引入
    if(this.amdList.length > 0) {
      _list.push(t.importDeclaration([t.importSpecifier(
        t.identifier('loadModules')
      )], t.stringLiteral('esri-loader')))
    }
  }

  // 获取一个用esri-loader加载amd模块的函数
  getLoadFun() {
    if(this.amdList.length > 0) {
      const loaderDec = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.arrayPattern(this.amdList.map(item => item.specifier != null ? t.identifier(item.specifier) : Math.random().toString(32).substr(2))),
          t.awaitExpression(
            t.callExpression(
              t.identifier('loadModules'),
              t.arrayExpression(this.amdList.map(item => t.stringLiteral(item.source)))
            )
          )
        )
      ])

      return t.classMethod('method', t.identifier('loadAmdModules'), [], t.blockStatement(loaderDec), false, false, false, true)
    }
  }

  // 是否只能通过AMD的方式导入，比如dojo相关的
  isAmdSource(value) {
    return AMD_IMPORT_LIST.some(i => value.indexOf(i) !== -1)
  }
}

export default WidgetImport
