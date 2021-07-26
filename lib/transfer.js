const parser = require('@babel/parser')
const fs = require('fs-extra')
const path = require('path')
const t = require('@babel/types')
const traverse = require('@babel/traverse')



const testParser = async function(filePath) {
  const code = await fs.readFile(filePath)
  if(code) {
    const ast = parser.parse(code.toString())
    traverse.default(ast, { 
      enter(path) {
        console.log(`type is ${path.node.type}, name is ${path.node.name || path.node.value}`)
        switch(getType(path.node)) {
          case 'define':

            break
        }
      }
    })
  }
}

const getType = function(node) {
  if(t.isCallExpression(node) && node.callee.name === 'define') {
    return 'define'
  }
}

testParser(path.join(__dirname, './Target.js'))