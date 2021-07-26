const traverse = require('@babel/traverse')

class Util {
  static findFirstNode(ast, conditionFun) {
    return Promise((resolve) => {
      traverse(ast, {
        enter(path) {
          if(typeof conditionFun==='function' && conditionFun(path.node)) {
            resolve(path.node)
          }
        }
      })
    })
  }
}

module.exports = Util
