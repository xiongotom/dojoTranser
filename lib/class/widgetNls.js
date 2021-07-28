const t = require('@babel/types')
const parser = require('@babel/parser')
const path = require('path')
const fs = require('fs')
const Util = require('../util/util')

const NLS_FILE_PATH = [
  './nls/zh-cn/strings.js'
]

// 国际化文件读入
class WidgetNls {
  constructor(jsFilePath) {
    this.jsFilePath = jsFilePath;
    this.nlsFilePath = this.getNlsFilepath(jsFilePath)
  }

  getNlsFilepath(jsFilePath) {
    const dirname = path.dirname(jsFilePath)
    for(let f of NLS_FILE_PATH) {
      let _path = path.join(dirname, f)
      if(fs.existsSync(_path)) {
        return _path
      }
    }
  }

  // 获取内容节点
  async getContentNode() {
    if(this.nlsFilePath) {
      const fileStr = Util.readFileSync(this.nlsFilePath)
      const ast = parser.parse(fileStr)
      const content = await Util.findFirstNode(ast, node => {
        return t.isObjectExpression(node) //&& node.parent.callee.name === 'define'
      })
      if(content) {
        const contentNode = t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier('nls'), content)
        ])
        t.addComment(contentNode, 'leading', 'NLS内容')
        return contentNode
      }
    }
  }
}

module.exports = WidgetNls