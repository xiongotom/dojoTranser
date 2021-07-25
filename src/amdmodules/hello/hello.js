// define([
//   'dojo/dom-construct'
// ], function(
//   domConstruct
// ) {
//   const el = document.querySelector('#dojoDiv')
//   domConstruct.place('<span>Hello DOJO</span>', el) 
// });
import {loadModules} from 'esri-loader'

// import domConstruct from 'dojo/dom-construct'

class Hello {
  constructor() {
    this.tryDom()
  }

  async tryDom() {
    const [domConstruct] = await loadModules(['dojo/dom-construct'])
    const el = document.querySelector('#dojoDiv')
    domConstruct.place('<span>Hello DOJO</span>', el) 
  }
}

export default Hello
