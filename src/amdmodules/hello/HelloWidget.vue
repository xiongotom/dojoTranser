<template>
  <div>
    <div ref="one"></div>
  </div>
</template>

<script>
// import { loadModules } from 'esri-loader'
import loadModules from '../dojoLoader' 

class Hello {
  static async getClass() {
    const [declare, _WidgetBase, _TemplatedMixin, ] = await loadModules([
      'dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin'
    ])

    const mo = () => {
      return declare([_WidgetBase, _TemplatedMixin], {
        templateString: '<div>1111</div>',
        constructor() {

        },
        postCreate() {
          // this.inherited()
        }
      })
    }
    return mo()
  }
}

export default {
  async mounted() {
    const clz = await Hello.getClass()
    const inst = new clz()
    this.$refs.one.appendChild(inst.domNode)
  }
}
</script>

<style>

</style>