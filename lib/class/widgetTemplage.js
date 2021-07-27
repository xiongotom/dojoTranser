const t = require('@babel/types')
const path = require('path')
const fs = require('fs')
const Util = require('../util/util')


class WidgetTemplate {
  constructor(ast, jsFilePath) {
    this._tree = ast
    this.jsFilePath = jsFilePath
    this.templateString = ''
  }

  async init() {
    const defineNode = await Util.findFirstNode(this._tree)
    if(defineNode && defineNode.arguments.length >= 2) {
      const sourceList = defineNode.arguments[0]
      const textSource = sourceList.find(item => item.value.startsWith('dojo/text'))
      let htmlFilePath = ''
      if(textSource) {
        htmlFilePath = path.join(path.dirname(this.jsFilePath), textSource.split('!')[1])
      } else {
        // 尝试找同目录下同名的html文件
        htmlFilePath = this.jsFilePath.replace('.js', '.html')
      }
      if(htmlFilePath) {
        if(fs.existsSync(htmlFilePath)) {
          this.templateString = fs.readFileSync(htmlFilePath)
        }
      }
    }
  }

  getHtmlTemplate() {
    if(this.templateString) {
      
    }
  }
}