// Set up the OpenAI API endpoint and API key
//const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
//const OPENAI_API_KEY = "sk-";
//const modelName= "gpt-4o-mini";
//const maxToken = 4096;

const OPENAI_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_API_KEY = "gsk_";
const modelName= "llama-3.1-70b-versatile";
const maxToken = 8000;

// Set up the chat log
let chatLog = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendMessage") {
    const message = request.message;
    chatLog.push({ role: "user", content: message });
    chrome.runtime.sendMessage({ action: "addUserMessage", message }).then(()=>{
      sendChatRequest(chatLog);
    });    
  } else if (request.action === "getText") {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getText" }, function(response) {
        sendResponse(response);
      });
    });
  }
});

// Send a chat request to the OpenAI API
function sendChatRequest(chatLog) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  const data = {
    model: modelName,
    stream: true,
    temperature: 0.5,
    max_tokens: maxToken, 
    messages: chatLog,
  };
  fetch(OPENAI_API_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  .then((response) => response.body.getReader())
  .then((reader) => {
      let isFirst = true;

      const readChunk = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            return;
          }
          const chunk = new TextDecoder("utf-8").decode(value); // convert Uint8Array to string
          const jsonChunks = chunk.split("\n"); // split into individual JSON objects
          let assistantAnswer = "";

          jsonChunks.forEach((jsonChunk) => {
            if (jsonChunk) { // ignore empty strings
              const jsonData = jsonChunk.replace(/^data: /, ''); // remove "data: " prefix
              if (jsonData && !jsonData.startsWith('[DONE]')) {
                let chunkData;
                try{
                  chunkData = JSON.parse(jsonData);
                }catch{}

                if (chunkData.choices && chunkData.choices[0].delta) {
                  let message = "";
                  
                  try{
                    message = chunkData.choices[0].delta.content || "";
                  }catch{}

                  assistantAnswer += message;

                  chrome.runtime.sendMessage({ action: "streamMessage", isFirst: isFirst, isDone : false, message });

                  isFirst = false;

                  // marked.setOptions({
                  //     sanitize: true,
                  //     gfm: true,
                  //     tables: true,
                  //     breaks: false // Enable GFM line breaks
                  // });
                
                  // if (message){
                  //     const htmlContent = marked.parse(message);

                  //     chrome.runtime.sendMessage({ action: "streamMessage", htmlContent });
                  // }                    
                }
              }
              else{
                  chrome.runtime.sendMessage({ action: "streamMessage", isDone : true });
                  chatLog.push({ role: "assistant", content: assistantAnswer });
              }
            }
          });
          readChunk();
        });
      };
      readChunk();
    });
}