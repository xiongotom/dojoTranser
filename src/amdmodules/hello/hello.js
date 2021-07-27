// window.define([
//   'dojo/dom-construct'
// ], function(
//   domConstruct
// ) {
//   const el = document.querySelector('#dojoDiv')
//   domConstruct.place('<span>Hello DOJO a</span>', el) 
// });
import {loadModules} from 'esri-loader'

class Hello {
  static async getClass() {
    const [declare, domConstruct] = await loadModules(['dojo/_base/declare','dojo/dom-construct'])
    const mo = () => {
      return declare([], {
        init() {
          const el = document.querySelector('#dojoDiv')
          domConstruct.place('<span>Hello DOJO AAB</span>', el) 
        }
      })
    }
    return mo()
  }
  static async create() {
    const clz = await this.getClass()
    return new clz()
  }
}

export default Hello
