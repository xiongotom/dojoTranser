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

// class Hello {
//   constructor() {
//     // this.mo = await this.tryDom()
//   }

//   static async load() {
//     const [declare, domConstruct] = await loadModules(['dojo/_base/declare','dojo/dom-construct'])
//     const mo = declare([], {
//       init() {
//         const el = document.querySelector('#dojoDiv')
//         domConstruct.place('<span>Hello DOJO</span>', el) 
//       }
//     })
//     return new mo()
//   }
// }

const load = async function() {
  const [declare, domConstruct] = await loadModules(['dojo/_base/declare','dojo/dom-construct'])
  const mo = declare([], {
    init() {
      const el = document.querySelector('#dojoDiv')
      domConstruct.place('<span>Hello DOJO AAA</span>', el) 
    }
  })
  return new mo()
}

export default load
