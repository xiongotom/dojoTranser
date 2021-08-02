
const loadModules = function(modules) {
  return new Promise(resolve => {
    window.require(modules, function(){
      resolve(arguments)
    })
  })
}

export default loadModules
