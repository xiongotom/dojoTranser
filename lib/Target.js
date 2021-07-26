import {loadModules} from 'esri-loader'

// import domConstruct from 'dojo/dom-construct'

class Hello {
  constructor() {
    // this.tryDom()
  }

  async tryDom() {
    const [declare, domConstruct] = await loadModules(['dojo/_base/declare','dojo/dom-construct'])
    const mo = declare([], {
      init() {
        const el = document.querySelector('#dojoDiv')
        domConstruct.place('<span>Hello DOJO</span>', el) 
      }
    })
    return mo
  }
}

export default Hello
