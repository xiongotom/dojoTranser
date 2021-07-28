const t = require('@babel/types')
const traverse = require('@babel/traverse')
const fs = require('fs-extra')
const iconv = require('iconv-lite')

iconv.skipDecodeWarning = true

class Util {
  static readFileSync(filepath) {
    const content = fs.readFileSync(filepath, {encoding: 'binary'})
    return iconv.decode(content, 'utf8')
  }

  /**
   * 获取第一个define节点，一般只有一个
   * @param {t.File} ast 
   * @returns 
   */
  static findDefineNode(ast) {
    return Util.findFirstNode(ast, node => {
      return t.isCallExpression(node) && node.callee.name === 'define'
    })
  }

  static findFirstNode(ast, conditionFun) {
    return new Promise((resolve) => {
      let _timer = setTimeout(() => {
        resolve(null)
      },300)
      traverse.default(ast, {
        enter(path) {
          clearTimeout(_timer)
          if(typeof conditionFun==='function' && conditionFun(path.node)) {
            resolve(path.node)
            path.stop()
          } else {
            _timer = setTimeout(() => {
              resolve(null)
            },300)
          }
          // let target = path.find(path => conditionFun(path.node))
          // resolve(target)
          // path.stop()
        },
      })
    })
  }

  static findAllNode(ast, conditionFun) {
    let arr = []
    return new Promise((resolve) => {
      let _timer = setTimeout(() => {
        resolve(null)
      },300)
      traverse.default(ast, {
        enter(path) {
          clearTimeout(_timer)
          if(typeof conditionFun==='function' && conditionFun(path.node)) {
            // resolve(path.node)
            arr.push(path.node)
          } else {
            _timer = setTimeout(() => {
              resolve(arr)
            },300)
          }
        },
      })
    })
  }

  static findPath(ast, node) {
    return new Promise((resolve) => {
      let _timer = setTimeout(() => {
        resolve(null)
      },300)
      traverse.default(ast, {
        enter(path) {
          clearTimeout(_timer)
          if(path.node === node) {
            resolve(path)
            path.stop()
          } else {
            _timer = setTimeout(() => {
              resolve(null)
            },300)
          }
          // let target = path.find(path => conditionFun(path.node))
          // resolve(target)
          // path.stop()
        },
      })
    })
  }
}

module.exports = Util
