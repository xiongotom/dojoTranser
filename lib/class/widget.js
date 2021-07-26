const t = require('@babel/types')
const Util = require('../util/util')
const WidgetImport = require('./widgetImport')
const fs = require('fs-extra')

class Widget {
  constructor(filePath) {
    this.filePath = filePath
  }
}

export default Widget
