
const { default: makeWASocket, DisconnectReason, makeInMemoryStore, jidDecode, proto, getContentType, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('node:fs')
const readline = require("node:readline");
const axios = require("axios")
const FileType = require('file-type');
const PhoneNumber = require('awesome-phonenumber')
const https = require('https')
const path = require('path')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => { rl.question(text, resolve) }) };

async function startBotz() {
const { state, saveCreds } = await useMultiFileAuthState("session")
const sock = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: false,
auth: state,
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
emitOwnEvents: true,
fireInitQueries: true,
generateHighQualityLinkPreview: true,
syncFullHistory: true,
markOnlineOnConnect: true,
browser: ["Ubuntu", "Chrome", "20.0.04"],
});

if (!sock.authState.creds.registered) {
const phoneNumber = await question('Enter Phone Number :\n');
let code = await sock.requestPairingCode(phoneNumber);
code = code?.match(/.{1,4}/g)?.join("-") || code;
console.log(`Pairing Code :`, code);
}

store.bind(sock.ev)

sock.ev.on('messages.upsert', async chatUpdate => {
try {
mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
m = smsg(sock, mek, store)
require("./system/cmd")(sock, m, chatUpdate, store)
} catch (err) {
console.log(err)
}
})
//FUNC
const bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 

const getBuffer = async (url, options) => {
  try {
    options ? options : {}
    const res = await axios({
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (err) {
    return err
  }
}

const getSizeMedia = async (path) => {
    return new Promise((resolve, reject) => {
        if (typeof path === 'string' && /http/.test(path)) {
            axios.get(path).then((res) => {
                let length = parseInt(res.headers['content-length'])
                if(!isNaN(length)) resolve(bytesToSize(length, 3))
            })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            if(!isNaN(length)) resolve(bytesToSize(length, 3))
        } else {
            reject(0)
        }
    })
}
// ======== SETTINGS ===================
sock.getFile = async (PATH, save) => {
  let res;
  let filename;
  let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
  let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
  filename = path.join(__dirname, './tmp/' + new Date * 1 + '.' + type.ext)
  if (data && save) fs.promises.writeFile(filename, data)
  return {
    res,
    filename,
    size: await getSizeMedia(data),
    ...type,
    data
  }
}

sock.parseMention = (text = "") => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
      (v) => v[1] + "@s.whatsapp.net",
    );
  }
  
sock.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
  const { mime, data, filename } = await sock.getFile(path, true);
  const isWebpSticker = options.asSticker || /webp/.test(mime);
  let type = 'document', mimetype = mime, pathFile = filename;
  if (isWebpSticker) {
    pathFile = await writeExif(data, {
      packname: options.packname || global.packname,
      author: options.author || global.author,
      categories: options.categories || [],
    })
    await fs.unlinkSync(filename);
    type = 'sticker';
    mimetype = 'image/webp';
  } else if (/image|video|audio/.test(mime)) {
    type = mime.split('/')[0];
    mimetype = type == 'video' ? 'video/mp4' : type == 'audio' ? 'audio/mpeg' : mime
  }
  let anu = await sock.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options });
  await fs.unlinkSync(pathFile);
  return anu;
}


sock.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    async function getFileUrl(res, mime) {
      if (mime && mime.includes('gif')) {
        return sock.sendMessage(jid, { video: res.data, caption: caption, gifPlayback: true, ...options }, { quoted });
      } else if (mime && mime === 'application/pdf') {
        return sock.sendMessage(jid, { document: res.data, mimetype: 'application/pdf', caption: caption, ...options }, { quoted });
      } else if (mime && mime.includes('webp') && !/.jpg|.jpeg|.png/.test(url)) {
        return sock.sendAsSticker(jid, res.data, quoted, options);
      } else if (mime && mime.includes('image')) {
        return sock.sendMessage(jid, { image: res.data, caption: caption, ...options }, { quoted });
      } else if (mime && mime.includes('video')) {
        return sock.sendMessage(jid, { video: res.data, caption: caption, mimetype: 'video/mp4', ...options }, { quoted });
      } else if (mime && mime.includes('audio')) {
        return sock.sendMessage(jid, { audio: res.data, mimetype: 'audio/mpeg', ...options }, { quoted });
      }
    }
    const axioss = axios.create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    const res = await axioss.get(url, { responseType: 'arraybuffer' });
    let mime = res.headers['content-type'];
    if (!mime || mime.includes('octet-stream')) {
      const fileType = await FileType.fromBuffer(res.data);
      mime = fileType ? fileType.mime : null;
    }
    const hasil = await getFileUrl(res, mime);
    return hasil
  }

sock.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

sock.getName = (jid, withoutContact= false) => {
id = sock.decodeJid(jid)
withoutContact = sock.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = sock.groupMetadata(id) || {}
resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === sock.decodeJid(sock.user.id) ?
sock.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
}

sock.public = true

sock.serializeM = (m) => smsg(sock, m, store);
sock.ev.on('connection.update', (update) => {
const { connection, lastDisconnect } = update;
if (connection === 'close') {
let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
if (reason === DisconnectReason.badSession || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionReplaced || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
startBotz();
} else if (reason === DisconnectReason.loggedOut) {
} else {
sock.end(`Unknown DisconnectReason: ${reason}|${connection}`);
}
} else if (connection === 'open') {
console.log('[Connected] ' + JSON.stringify(sock.user.id, null, 2));
}
});

sock.ev.on('creds.update', saveCreds)

sock.sendText = (jid, text, quoted = '', options) => sock.sendMessage(jid, { text: text, ...options }, { quoted })

sock.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

return sock
}

startBotz()

function smsg(sock, m, store) {
if (!m) return m
let M = proto.WebMessageInfo
if (m.key) {
m.id = m.key.id
m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
m.chat = m.key.remoteJid
m.fromMe = m.key.fromMe
m.isGroup = m.chat.endsWith('@g.us')
m.sender = sock.decodeJid(m.fromMe && sock.user.id || m.participant || m.key.participant || m.chat || '')
if (m.isGroup) m.participant = sock.decodeJid(m.key.participant) || ''
}
if (m.message) {
m.mtype = getContentType(m.message)
m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text
let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
if (m.quoted) {
let type = getContentType(quoted)
m.quoted = m.quoted[type]
if (['productMessage'].includes(type)) {
type = getContentType(m.quoted)
m.quoted = m.quoted[type]
}
if (typeof m.quoted === 'string') m.quoted = {
text: m.quoted
}
m.quoted.mtype = type
m.quoted.id = m.msg.contextInfo.stanzaId
m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
m.quoted.sender = sock.decodeJid(m.msg.contextInfo.participant)
m.quoted.fromMe = m.quoted.sender === sock.decodeJid(sock.user.id)
m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
m.getQuotedObj = m.getQuotedMessage = async () => {
if (!m.quoted.id) return false
let q = await store.loadMessage(m.chat, m.quoted.id, conn)
 return exports.smsg(conn, q, store)
}
let vM = m.quoted.fakeObj = M.fromObject({
key: {
remoteJid: m.quoted.chat,
fromMe: m.quoted.fromMe,
id: m.quoted.id
},
message: quoted,
...(m.isGroup ? { participant: m.quoted.sender } : {})
})
m.quoted.delete = () => sock.sendMessage(m.quoted.chat, { delete: vM.key })
m.quoted.copyNForward = (jid, forceForward = false, options = {}) => sock.copyNForward(jid, vM, forceForward, options)
m.quoted.download = () => sock.downloadMediaMessage(m.quoted)
}
}
if (m.msg.url) m.download = () => sock.downloadMediaMessage(m.msg)
m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''
  m.expiration = m.msg?.contextInfo?.expiration || 0;
  m.reply = async (text, options = {}) => {
    if (typeof text === 'string') {
     await sock.sendMessage(m.chat, { text, mentions: [...sock.parseMention(text)], ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options });
    } else if (typeof text === 'object' && typeof text !== 'string') {
   await sock.sendMessage(m.chat, { ...text, ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options });
    }
  };
m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))
m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => sock.copyNForward(jid, m, forceForward, options)

return m
}


let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})