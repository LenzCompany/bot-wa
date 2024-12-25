




global.owner = [
    "6285640575421", //should start with country code
    ""  //second number if available
]
  global.api = {
      ndaa: 'https://api.ndaadev.us.kg/api/',
      }
  let fs = require('node:fs')
  let file = require.resolve(__filename)
  fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Update ${__filename}`)
  delete require.cache[file]
  require(file)
  })

