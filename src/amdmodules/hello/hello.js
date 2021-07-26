// window.define([
//   'dojo/dom-construct'
// ], function(
//   domConstruct
// ) {
//   const el = document.querySelector('#dojoDiv')
//   domConstruct.place('<span>Hello DOJO a</span>', el) 
// });
import {loadModules} from 'esri-loader'

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
