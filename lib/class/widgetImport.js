const t = require('@babel/types')
const Util = require('../util/util')
const EsriImportUtil = require('../util/esriImportUtil')


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
    // const defineNode = this._tree.find(path => {
    //   const node = path.node
    //   return t.isCallExpression(node) && node.callee.name === 'define' && node.arguments.length === 2
    // })
    if(defineNode && defineNode.arguments.length >= 2) {
      const sourceList = defineNode.arguments[0].elements
      const specifiers = defineNode.arguments[1].params
      this.analysis(sourceList, specifiers)
    }
  }
  // 分析，分别找出可以import的和需要用amd方式加载的
  analysis(sourceList, specifiers) {
    let importList = []
    let amdList = []
    let repeatSet = new Set()
    for(let i=0; i<sourceList.length; i++) {
      let _obj = {
        source: sourceList[i],
        specifier: i < specifiers.length ? specifiers[i] : null
      }
      let _sname = sourceList[i].value
      if(repeatSet.has(_sname)) {
        continue
      }
      repeatSet.add(_sname)
      // arcgis js api 3.x to 4.x
      if(EsriImportUtil.needConvert(_sname)) {
        _obj.source.value = EsriImportUtil.convert(_sname)
      }
      // if(_obj.specifier) {
      //   Util.findPath(this._tree, _obj.specifier).then(res => {
      //     console.log(res)
      //   })
      // }
      if(this.isAmdSource(sourceList[i])) {
        amdList.push(_obj)
      } else {
        importList.push(_obj)
        // if(_obj.specifier) {
        //   traverse.default(this._tree, {
        //     enter(path) {
        //       if(path.isIdentifier() && path.node !== _obj.specifier && path.node.name === _obj.specifier.name) {
        //         console.log(path)
        //       }
        //     }
        //   })
        // }
      }
    }
    this.amdList = amdList
    this.importList = importList
  }
  // 获取import的ast节点对象
  getImportList() {
    const _list = this.importList.map(item => {
      const _source = t.stringLiteral(item.source.value)
      const _spe = t.identifier(item.specifier.name)
      return t.importDeclaration([t.importDefaultSpecifier(_spe)], _source)
    })
    // // 增加对于esri-loader的引入
    if(this.amdList.length > 0) {
      _list.push(t.importDeclaration([t.importSpecifier(
        t.identifier('loadModules'), 
        t.identifier('loadModules')
      )], t.stringLiteral('esri-loader')))
    }
    return _list
  }

  // 获取一个用esri-loader加载amd模块的函数
  getLoadExpression() {
    const _list = (this.amdList || []).filter(i => !i.source.value.startsWith('dojo/text'))
    if(_list.length > 0) {
      const loaderDec = t.variableDeclaration('const', [
        t.variableDeclarator(
          t.arrayPattern(_list.map(item => t.identifier(item.specifier != null ? item.specifier.name : 'not_use_module_' + Math.random().toString(32).substr(2)))),
          t.awaitExpression(
            t.callExpression(
              t.identifier('loadModules'),
              [t.arrayExpression(_list.map(item => t.stringLiteral(item.source.value)))]
            )
          )
        )
      ])
      return loaderDec
      // return t.classMethod('method', t.identifier('loadAmdModules'), [], t.blockStatement(loaderDec), false, false, false, true)
    }
  }

  // 是否只能通过AMD的方式导入，比如dojo相关的
  isAmdSource(node) {
    return AMD_IMPORT_LIST.some(i => node.value.indexOf(i) === 0)
  }
}

module.exports = WidgetImport
