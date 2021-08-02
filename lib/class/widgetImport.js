const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const Util = require('../util/util')
const EsriImportUtil = require('../util/esriImportUtil')


const AMD_IMPORT_LIST = [
  'dojo/',
  'dijit/',
  'dojox/'
]

class WidgetImport {
  constructor(ast, templateDepends=[]) {
    this._tree = ast
    this.amdList = []
    this.importList = []
    this.templateDepends = templateDepends
  }
  // 初始化
  async init() {
    const defineNode = await Util.findFirstNode(this._tree, (node) => {
      return t.isCallExpression(node) && node.callee.name === 'define' && node.arguments.length === 2
    })
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
      // 避免重复引入
      if(repeatSet.has(_sname)) {
        continue
      }
      repeatSet.add(_sname)
      // arcgis js api 3.x to 4.x
      if(EsriImportUtil.needConvert(_sname)) {
        _obj.source.value = EsriImportUtil.convert(_sname)
      }
      // 区分dojo跟非dojo的（使用import方式引入） 
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

  static hasImport(tree, source, target) {
    return new Promise(resolve => {
      traverse(tree, {
        enter(path) {
          if(path.isImportDeclaration()) {
            const _node = path.node
            if(_node.source.value === source && _node.specifiers.some(item => item.local.name === target)){
              resolve(path)
              path.stop()
            }
          }
        },
        exit(path) {
          if(path.isProgram()) {
            resolve(null)
          }
        }
      })
    })
  }

  /**
   * 重新分析书中的所有import
   * @param {*} tree 
   */
  static getAllImportPath(tree) {
    const _list = []
    return new Promise(resolve => {
      traverse(tree, {
        enter(path) {
          if(path.isImportDeclaration()) { 
            _list.push(path)
          }
        },
        exit(path) {
          if(path.isProgram()) {
            resolve(_list)
          }
        }
      })
    })
  }

  static async addImport(tree, source, target) {
    const allList = await WidgetImport.getAllImportPath(tree)
    // 组织import node
    let _importNode = null
    if(typeof target === 'string') {
      _importNode = t.importDeclaration([t.importDefaultSpecifier(t.identifier(target))], t.stringLiteral(source))
    } else if(Array.isArray(target)) {
      _importNode = t.importDeclaration(target.map(item => t.importSpecifier(t.identifier(item), t.identifier(item))), t.stringLiteral(source))
    }
    if(allList.length === 0) {
      tree.program.body.unshift(_importNode)
    } else if(allList.every(path => path.node.source.value !== source && !path.node.specifiers.find(item => item.local.name === target))) {
      let _index = allList.length
      // allList[0].parent.body.splice(_index, 0, _importNode)
      allList[_index -1].insertAfter(_importNode)
    }
    // traverse(tree, {
    //   exit(path) {
    //     if(path.isImportDeclaration()) {
    //       // 如果已经存在，则无需添加了
    //       if(that.importList[that.importList.length - 1].source.value === path.node.source.value)
    //       // 在最后一个的末尾添加
    //       if(that.importList.length === 0 || (that.importList.length > 0 && that.importList[that.importList.length - 1].source.value === path.node.source.value)) {
    //         let _importNode = null
    //         if(typeof target === 'string') {
    //           _importNode = t.importDeclaration([t.importDefaultSpecifier(t.identifier(target))], t.stringLiteral(source))
    //         } else if(Array.isArray(target)) {
    //           _importNode = t.importDeclaration(target.map(item => t.importSpecifier(t.identifier(item), t.identifier(item))), t.stringLiteral(source))
    //         }
    //         path.insertAfter(_importNode)
    //         that.importList.push(_importNode)
    //       }
    //     }
    //   }
    // })
  }
}

module.exports = WidgetImport
