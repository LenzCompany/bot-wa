require("../config")
const fs = require('fs')
const util = require('util')
const axios = require('axios')
const { exec } = require("child_process")
const SimplDB = require("simpl.db");
const { ChatGPTv2 } = require("../lib/function.js") 

module.exports = async (sock, m) => {
try {
const body = (
(m.mtype === 'conversation' && m.message.conversation) ||
(m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
(m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
(m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
(m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
(m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
(m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
) ? (
(m.mtype === 'conversation' && m.message.conversation) ||
(m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
(m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
(m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
(m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
(m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
(m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
) : '';

const budy = (typeof m.text === 'string') ? m.text : '';
const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
const isCmd = body.startsWith(prefix);
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = body.trim().split(/ +/).slice(1)
const text = q = args.join(" ")
const sender = m.key.fromMe ? (sock.user.id.split(':')[0]+'@s.whatsapp.net' || sock.user.id) : (m.key.participant || m.key.remoteJid)
const botNumber = await sock.decodeJid(sock.user.id)
const senderNumber = sender.split('@')[0]
const isCreator = (m && m.sender && [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;
const pushname = m.pushName || `${senderNumber}`
const isBot = botNumber.includes(senderNumber)

//DFAIL

global.dfail = {
    ownerOnly: `You are not the owner of this bot`,
    example: `${prefix + command}`,
}


//CONSOLE MESSAGE & DATABASE
const db = new SimplDB();
global.db = db

if (m.message) {
    //DATABASE USER
    const userDb = await db.get(`user.${m.sender}`);
    if (!userDb) {
        await db.set(`user.${m.sender}`, {
            coin: 1000,
            level: 0,
            uid: generateUID(m.sender),
            xp: 0
        });
    }
    //CONSOLE MESSAGE
    console.log(`GOT NEW MESSAGE FROM : ${pushname} MESSSAGE : ${budy || m.type}`)
}

//COMMANDS
switch(command) {
        //============ DOWNLOADER ============
    case "tiktok":
    case "tt": {
        if (!text) return m.reply(`${global.dfail.example} url`)
        let data = await fetch(`${global.api.ndaa}tiktok?url=${text}`)
        let json = await data.json()
        sock.sendFileUrl(m.chat, json.result.play, 'DONE', m)
    }
break
default:
    if (budy.startsWith('@62856405754211')) {

      if (!text && !m.quoted.body) {
        return m.reply("query?")
      }
      let input = text ? text : m.quoted.body
      
      let response = await ChatGPTv2(input, "openai")
      m.reply(response)
    }
if (budy.startsWith('=>')) {
if (!isCreator) return m.reply(dfail.ownerOnly)
function Return(sul) {
sat = JSON.stringify(sul, null, 2)
bang = util.format(sat)
if (sat == undefined) {
bang = util.format(sul)
}
return m.reply(bang)
}
try {
m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
} catch (e) {
m.reply(String(e))
}
}

if (budy.startsWith('>')) {
if (!isCreator) return m.reply(dfail.ownerOnly)
let kode = budy.trim().split(/ +/)[0]
let teks
try {
teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${q}})()`)
} catch (e) {
teks = e
} finally {
await m.reply(require('util').format(teks))
}
}

if (budy.startsWith('$')) {
if (!isCreator) return m.reply(dfail.ownerOnly)
exec(budy.slice(2), (err, stdout) => {
if (err) return m.reply(`${err}`)
if (stdout) return m.reply(stdout)
})
}
}

} catch (err) {
console.log(util.format(err))
}
}
//AUTO RELOAD
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})

//END