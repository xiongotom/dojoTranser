const OLD_NAME = 'esri/'
const BASE_NAME = '@arcgis/core/'
const importMap = (() => {
  const _map = {
    'map': 'Map',
    'graphic':  'Graphic',
    'InfoTemplate': 'PopupTemplate',
    'toolbars/draw': 'widgets/Sketch/SketchViewModel',
    'IdentityManager': 'identity/IdentityManager',
    'SpatialReference': 'geometry/SpatialReference',
    'arcgis/OAuthInfo': 'identity/OAuthInfo',
    'geometry/webMercatorUtils': 'geometry/support/webMercatorUtils',
    'lang': 'core/lang',
    'urlUtils': 'core/urlUtils',
    'symbols/jsonUtils': 'symbols/support/jsonUtils',
    'tasks/ProjectParameters': 'tasks/support/ProjectParameters',
    'tasks/Query': 'tasks/support/Query',
  }
  const res = Object.create(null)
  for(let k in _map) {
    res[OLD_NAME+k] = BASE_NAME + _map[k]
  }
  return res
})()


class EsriImportUtil {
  /**
   * 判断是否需要转换
   */ 
  static needConvert(source) {
    if(source.startsWith('esri/')) {
      return true
    }
    return false
  }

  static convert(source) {
    let res = source
    // by import map config
    if(importMap[res]) {
      res = importMap[res]
    }
    // esri -> @arcgis/core
    if(res.startsWith('esri/')){
      res = res.replace('esri/', '@arcgis/core/')
    }
    return res
  }
}

module.exports = EsriImportUtil