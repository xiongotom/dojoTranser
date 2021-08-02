<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <hello-widget></hello-widget>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Hello from './amdmodules/hello/hello'
import HelloWidget from './amdmodules/hello/HelloWidget.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    HelloWidget
  },
  async mounted() {
    window.dojoConfig = {
      async: true,
      packages: [
        {
          location: './amdmodules',
          name: 'amdm'
        }
      ]
    }
    // window['require'](['amd/hello/hello'],(Hello) => {
    //   console.log(Hello)
    // })

    const hel = await Hello.create()
    hel.init()
    console.log(hel)
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
