const t = require('@babel/types')
const path = require('path')
const fs = require('fs')
const Util = require('../util/util')
const cheerio = require('cheerio')


const TEMPLATE_VAR_NAME = "HTML_TEMPLATE"


class WidgetTemplate {
  constructor(ast, jsFilePath) {
    this._tree = ast
    this.jsFilePath = jsFilePath
    this.templateString = ''
  }

  async init() {
    const defineNode = await Util.findDefineNode(this._tree)
    if(defineNode && defineNode.arguments.length >= 2) {
      const sourceList = defineNode.arguments[0].elements || []
      const textSource = sourceList.find(item => item.value.startsWith('dojo/text'))
      let htmlFilePath = ''
      if(textSource) {
        htmlFilePath = path.join(path.dirname(this.jsFilePath), textSource.value.split('!')[1])
      } else {
        // 尝试找同目录下同名的html文件
        htmlFilePath = this.jsFilePath.replace('.js', '.html')
      }
      if(htmlFilePath) {
        if(fs.existsSync(htmlFilePath)) {
          // this.templateString = fs.readFileSync(htmlFilePath, {encoding: 'utf-8'}).toString()
          this.templateString = Util.readFileSync(htmlFilePath)
          // const $ = cheerio.load(this.templateString, {
          //   // xmlMode: true,
          // })
          // $('*[data-dojo-attach-point]').each((i, ele) => {
          //   console.log(ele)
          //   ele.attribs
          // })
          if(this.templateString) {
            this.templateString = this.templateString.trim()
          }
        }
      }
    }
  }

  buildTemplateNode() {
    const templateNode = t.variableDeclaration('const', [
      t.variableDeclarator(t.identifier(TEMPLATE_VAR_NAME), t.templateLiteral([t.templateElement({
        raw: this.templateString
      })], []))
    ])
    t.addComment(templateNode, 'leading', 'html模板内容')
    return templateNode
  }

  async append2Tree(tree) {
    if(this.templateString) {
      const bodyNode = await Util.findFirstNode(tree, node => {
        return t.isCallExpression(node) && node.callee.name === 'declare'
      })
      if(bodyNode) {
        const objNode = bodyNode.arguments.find(item => t.isObjectExpression(item))
        if(objNode) {
          const templateStringNode = await Util.findFirstNode(tree, node => {
            return t.isProperty(node) && node.key.name === 'templateString'
          })
          if(templateStringNode) {
            templateStringNode.value.name = TEMPLATE_VAR_NAME
          } else {
            objNode.properties.unshift(t.objectProperty(t.identifier('templateString'), t.identifier(TEMPLATE_VAR_NAME)))
          }
        }
      }
    }
    
  }
}

module.exports = WidgetTemplate
