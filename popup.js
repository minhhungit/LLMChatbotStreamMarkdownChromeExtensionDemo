//import * as smd from "./smd.js"

import * as mmd from "./scripts/nlux-markdown-esm/markdown.js"; // https://www.npmjs.com/package/@nlux/markdown

// Get the input and button elements
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatLog = document.getElementById("chat-log");

messageInput.focus();

// const messageElement = document.createElement('div');
// messageElement.id = 'markdown';
// chatLog.appendChild(messageElement);

// const renderer = smd.default_renderer(messageElement)
// const parser   = smd.parser(renderer)

let mdStreamParser;

// Listen for the send button click
sendButton.addEventListener("click", () => {
    const message = messageInput.value;
    messageInput.value = "";
    chrome.runtime.sendMessage({ action: "sendMessage", message });
});

messageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendButton.click();
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addUserMessage"){
        let userMsgElement = document.createElement('div');
        userMsgElement.classList.add('chat-message');
        userMsgElement.classList.add('user-message');
        
        chatLog.appendChild(userMsgElement);
        //userMsgElement.innerText = request.message;

        const options = {
            // markdownLinkTarget?: 'blank' | 'self';                       // default: 'blank'
            // syntaxHighlighter: (( Highlighter from @nlux/highlighter )), // default: undefined — for code blocks syntax highlighting
            showCodeBlockCopyButton: true,                           // default: true — for code blocks
            // skipStreamingAnimation?: boolean,                            // default: false
            //streamingAnimationSpeed: 2,                            // default: 10 ( milliseconds )
            // waitTimeBeforeStreamCompletion?: number | 'never',           // default: 2000 ( milliseconds )
            onComplete: () => console.log("Parsing complete"),           // triggered after the end of the stream
        };

        let userMdStreamParser = mmd.createMarkdownStreamParser(
            userMsgElement,
            options,
        );

        userMdStreamParser.next(request.message);
        userMdStreamParser.complete();

    } else if (request.action === "streamMessage") {
    
        const message = request.message;
        if (message == null || typeof message == "undefined"){
            return;
        }

        console.log(message);

        const isFirst = request.isFirst || false;
        const isDone = request.isDone || false;

        // smd sample    
        //smd.parser_write(parser, message)

        

        // On each chunk of markdown
        if (isFirst){
            //chatLog.innerHTML = '';
            // nlux markdown sample
            const options = {
                // markdownLinkTarget?: 'blank' | 'self';                       // default: 'blank'
                // syntaxHighlighter: (( Highlighter from @nlux/highlighter )), // default: undefined — for code blocks syntax highlighting
                showCodeBlockCopyButton: true,                           // default: true — for code blocks
                // skipStreamingAnimation?: boolean,                            // default: false
                //streamingAnimationSpeed: 2,                            // default: 10 ( milliseconds )
                // waitTimeBeforeStreamCompletion?: number | 'never',           // default: 2000 ( milliseconds )
                onComplete: () => console.log("Parsing complete"),           // triggered after the end of the stream
            };

            let assistantMsgElement = document.getElementById("markdown");
            if (!assistantMsgElement){
                assistantMsgElement = document.createElement('div');
                //assistantMsgElement.id = 'markdown';
                assistantMsgElement.classList.add('chat-message');
                assistantMsgElement.classList.add('assistant-message');
                chatLog.appendChild(assistantMsgElement);
            }

            mdStreamParser = mmd.createMarkdownStreamParser(
                assistantMsgElement,
                options,
            );

            //assistantMsgElement.innerHTML = '';
        }
        try{
            mdStreamParser.next(message);
        }catch{}

        if (isDone){
            mdStreamParser.complete();

            messageInput.focus();
        }    
    }
});