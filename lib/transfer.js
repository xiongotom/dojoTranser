const parser = require('@babel/parser')
const fs = require('fs-extra')
const fsRaw = require('fs')
const path = require('path')
const t = require('@babel/types')
const traverse = require('@babel/traverse')
const Widget = require('./class/widget')

const widgetBasePath = 'D:\\Code\\P_浦东威立雅\\GisPortalH5'
// const widgetBasePath = 'D:\\Code\\H_WS\\S_上海排水\\H5_SVN'
const widgetPath = path.join(widgetBasePath, 'widgets\\Advice\\Widget.js')
// const outPath = path.join(__dirname, '../out')
const outPath = 'D:\\Code\\W_吴中\\huge_portal\\src\\old'
const dojoPathMap = {
  'hugegis': path.join(widgetBasePath, 'hugegis.js'),
  'widgets': path.join(widgetBasePath, 'widgets')
}

const hasDeal = new Set([])

const testParser = async function(filePath, opath) {
  console.log(`start deal ${filePath}`)
  if(!fs.pathExistsSync(filePath)){
    console.error(`文件不存在:${filePath}`)
    return
  }
  const w = new Widget(filePath)
  await w.init()
  const _code = w.getCode()
  // console.log(_code)
  // fs.writeFile(filePath.replace('.js', '.mjs'), _code)
  // let fname = path.basename(filePath)
  // let opath = path.join(outPath, fname)
  await saveFile(opath, _code)
  const depList = w.dependencies.filter(i => i.source.value.indexOf('esri') === -1)
  console.log(`over: ${opath} has dependencies count ${depList.length}`)
  // 处理依赖
  if(!hasDeal.has(filePath)) {
    hasDeal.add(filePath)
    for(let item of depList) {
      await dealDepends(filePath, item.source.value)
    }
  }
}

const saveFile = async function(p, content) {
  const dirname = path.dirname(p)
  if(!fs.pathExistsSync(dirname)) {
    // fs.mkdir(dirname)
    fsRaw.mkdirSync(dirname, {recursive: true})
  }
  await fs.writeFile(p, content)
}

const dealDepends = async function(inFilePath, codePath) {
  let key = codePath.split('/')[0].trim()
  if(path.extname(codePath) === '') {
    codePath += '.js'
  }
  let filePath = ''
  if(key === '.') {
    // 相对路径
    filePath = path.join(path.dirname(inFilePath), codePath)
  } else if(dojoPathMap[key]) {
    filePath = path.join(dojoPathMap[key], codePath.replace(key, '.'))
  }
  if(filePath) {
    await testParser(filePath, filePath.replace(widgetBasePath, outPath))
  }
}

const main = async function() {
  await testParser(widgetPath, widgetPath.replace(widgetBasePath, outPath))
  console.log('is all over')
}

main()