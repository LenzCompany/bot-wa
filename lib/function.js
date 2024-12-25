const axios = require('axios')

async function ChatGPTv2(question, model) {
  const validModels = ["openai", "llama", "mistral", "mistral-large"]
  const data = JSON.stringify({
    messages: [question],
    character: model
  })
  const config = {
    method: 'POST',
    url: 'https://chatsandbox.com/api/chat',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
      'Content-Type': 'application/json',
      'accept-language': 'id-ID',
      'referer': `https://chatsandbox.com/chat/${model}`,
      'origin': 'https://chatsandbox.com',
      'alt-used': 'chatsandbox.com',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'priority': 'u=0',
      'te': 'trailers',
      'Cookie': '_ga_V22YK5WBFD=GS1.1.1734654982.3.0.1734654982.0.0.0; _ga=GA1.1.803874982.1734528677'
    },
    data: data
  }
    const response = await axios.request(config)
    return response.data
}

async function generateUID(phoneNumber) {
    if (typeof phoneNumber !== "string") {
        phoneNumber = phoneNumber.toString();
    }

    let hash = 0;
    for (let i = 0; i < phoneNumber.length; i++) {
        const charCode = phoneNumber.charCodeAt(i);
        hash = (hash * 31 + charCode) % 1000000007;
    }

    const uniquePart = phoneNumber.split("").reverse().join("").charCodeAt(0).toString(16);

    return `${Math.abs(hash).toString(16).toLowerCase()}-${uniquePart}`;
}

async function fetchJson(url) {
  try {
    let response = await axios.get(url)
    return response.data
  } catch(error) {
    console.log("fetch error")
  }
}

module.exports = { fetchJson, generateUID, ChatGPTv2 }