const PROXY_URL = 'http://localhost:3000/chat'; 
let chat = true; 

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const welcomeScreen = document.getElementById('welcomeScreen');
const typingIndicator = document.getElementById('typingIndicator');
const micButton = document.getElementById('micButton'); // NEW: Get the mic button element

let isFirstMessage = true;
let currentUtterance = null; 
let isSpeaking = false;
let isListening = false;

const defaultConfig = {
    welcome_message: "👋 Hi, I'm OMA — your Old Mutual Assistant. How can I help you today?",
    bot_name: "Old Mutual Assistant (OMA)",
    footer_text: "Powered by Team Innovation – Technovation Hackathon 2025"
};

//TTS configurations
const synth = window.speechSynthesis;

function stopSpeech() {
    if (synth && synth.speaking) {
        synth.cancel();
        currentUtterance = null;
        isSpeaking = false;
        document.querySelectorAll('.bot-audio-icon.sound-active').forEach(icon => {
            icon.classList.remove('sound-active');
        });
    }
}

function cleanTextForSpeech(text) {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    let cleanedText = text.replace(/e\.?\s*g\.?/gi, 'for example');
    cleanedText = cleanedText.replace(emojiRegex, '');
    cleanedText = cleanedText.replace(/\*/g, '');
    return cleanedText.replace(/\s+/g, ' ').trim();
}

function speakMessage(text, iconElement) {
    if (!synth || !text) {
        console.warn("Speech synthesis not available or no text provided.");
        return;
    }

    stopSpeech(); 
    if (isListening && recognition) recognition.stop();
    
    const speechText = cleanTextForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(speechText);
    currentUtterance = utterance;
    isSpeaking = true;
    
    let voices = synth.getVoices();
    const startTime = Date.now();
    const TIMEOUT_MS = 100; 

    while (voices.length === 0 && (Date.now() - startTime) < TIMEOUT_MS) {
        voices = synth.getVoices();
    }

    if (voices.length > 0) {
        let preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Zira')));
        if (!preferredVoice) {
            preferredVoice = voices.find(v => v.lang.startsWith('en'));
        }
        if (!preferredVoice) {
            preferredVoice = voices[0];
        }

        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang; 
    } else {
        utterance.lang = 'en-US';
    }
    
    //Wave animation when clicking sound icon
    iconElement.classList.add('sound-active');

    utterance.onend = () => {
        iconElement.classList.remove('sound-active');
        currentUtterance = null;
        isSpeaking = false;
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        iconElement.classList.remove('sound-active'); 
        currentUtterance = null;
        isSpeaking = false;
    };

    //Adjust speach, stuff like thes speed and pitch to make it sound better
    utterance.rate = 1.05; 
    utterance.pitch = 1.05; 
    utterance.volume = 0.9; 
    synth.speak(utterance);
}


//Setting up speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null; 

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('mic-recording');
        messageInput.placeholder = 'Listening... Speak now.';
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('mic-recording');
        messageInput.placeholder = 'Type your message here...';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        micButton.classList.remove('mic-recording');
        messageInput.placeholder = 'Type your message here...';
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            alert(`Voice input failed: ${event.error}. Please try again or type your message.`);
        }
    };
} else {
    if (micButton) micButton.style.display = 'none';
    console.warn("Web Speech API not supported in this browser.");
}


//Setting up the bot and message response
//intiallizing the proxy
function initializeChat() {
    if (PROXY_URL) {
        console.log("Chat initialized. Ready to connect to proxy.");
    } else {
        console.error("Proxy URL is missing.");
        addMessage("I'm not configured correctly. The chat service URL is missing.", false);
        messageInput.disabled = true;
        sendButton.disabled = true;
        chat = false;
        return;
    }
}

//getting the bot response using the proxy
async function getBotResponse(userMessage) {
    if (!chat) {
        return "I'm not ready to chat yet. Please check my configuration.";
    }

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        if (response.ok) {
            return data.text;
        } else {
            console.error("Proxy error response:", data.error);
            return data.error || "The chat service returned an error. Please try again.";
        }

    } catch (error) {
        console.error("Network or proxy connection error:", error);
        return "I couldn't reach the chat service. Check the server connection and ensure it is running on port 3000.";
    }
}


//UI funtions
function addMessage(message, isUser) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message', isUser ? 'user' : 'bot');
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.style.wordBreak = 'break-word';

    if (!isUser) {
        const avatarEl = document.createElement('div');
        avatarEl.classList.add('bot-avatar');
        avatarEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.9 2 2.7 6.2 2.7 11.3V12.7C2.7 17.8 6.9 22 12 22C17.1 22 21.3 17.8 21.3 12.7V11.3C21.3 6.2 17.1 2 12 2ZM12 4C16 4 19.3 7.3 19.3 11.3V12.7C19.3 16.7 16 20 12 20C8 20 4.7 16.7 4.7 12.7V11.3C4.7 7.3 8 4 12 4ZM12 8C10.7 8 9.7 7 9.7 5.7C9.7 4.4 10.7 3.3 12 3.3C13.3 3.3 14.3 4.4 14.3 5.7C14.3 7 13.3 8 12 8ZM12 16C12 14.7 10.7 13.7 9.3 13.7C8 13.7 7 14.7 7 16H9C9 15.3 9.6 14.7 10.3 14.7C11 14.7 11.6 15.3 11.6 16V16.7C10.6 16.7 9.7 17.6 9.7 18.7H14.3C14.3 17.6 13.4 16.7 12.3 16.7V16Z"/></svg>`; 
        messageWrapper.appendChild(avatarEl);
        messageContent.innerHTML = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const audioIconEl = document.createElement('div');
        audioIconEl.classList.add('bot-audio-icon');
        audioIconEl.dataset.messageText = message; 
        audioIconEl.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2C6.9 2 2.7 6.2 2.7 11.3V12.7C2.7 17.8 6.9 22 12 22C17.1 22 21.3 17.8 21.3 12.7V11.3C21.3 6.2 17.1 2 12 2ZM12 4C16 4 19.3 7.3 19.3 11.3V12.7C19.3 16.7 16 20 12 20C8 20 4.7 16.7 4.7 12.7V11.3C4.7 7.3 8 4 12 4ZM10 10V14L15 12L10 10Z"/>
            </svg>`;
        
        messageContent.appendChild(audioIconEl);
        messageWrapper.appendChild(messageContent); 

    } else {
        messageContent.textContent = message;
        messageWrapper.appendChild(messageContent); 
    }

    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight; 
}


function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (userMessage === '') return;

    stopSpeech(); 

    if (isListening && recognition) recognition.stop(); 

    if (isFirstMessage) {
        welcomeScreen.style.display = 'none';
        isFirstMessage = false;
    }

    addMessage(userMessage, true);
    messageInput.value = ''; 
    messageInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;
    showTypingIndicator();

    try {
        const botResponse = await getBotResponse(userMessage);
        addMessage(botResponse, false);
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        addMessage("Sorry, I ran into an unexpected issue.", false);
    } finally {
        hideTypingIndicator();
        messageInput.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false; // [NEW CODE] Re-enable mic
        messageInput.focus();
    }
}

//Adding event listeners
micButton.addEventListener('click', () => {
    if (!recognition) return;

    stopSpeech(); 
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch(e) {
            console.error("Error starting speech recognition:", e);
            alert("Could not start voice recognition. Please check your browser's microphone permissions, for example.");
        }
    }
});


document.addEventListener("click", (e) => {
    const icon = e.target.closest(".bot-audio-icon");
    if (!icon) return;
    const messageText = icon.dataset.messageText;

    if (isSpeaking && currentUtterance && currentUtterance.text === cleanTextForSpeech(messageText)) {
        stopSpeech();
    } else {
        speakMessage(messageText, icon);
    }
});


sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});


function onConfigChange(config) {
    if (welcomeScreen) {
        const welcomeTextEl = welcomeScreen.querySelector('.welcome-text');
        if (welcomeTextEl) {
            welcomeTextEl.textContent = config.welcome_message || defaultConfig.welcome_message;
        }
    }
    const headerTitleEl = document.querySelector('.chat-header h1');
    if (headerTitleEl) {
        headerTitleEl.textContent = config.bot_name || defaultConfig.bot_name;
    }
    const footerTextEl = document.querySelector('.footer p');
    if (footerTextEl) {
        footerTextEl.textContent = config.footer_text || defaultConfig.footer_text;
    }
}

function mapToCapabilities(config) {
    return {
        recolorables: [],
        borderables: [],
        fontEditable: undefined,
        fontSizeable: undefined
    };
}

function mapToEditPanelValues(config) {
    return new Map([
        ["welcome_message", config.welcome_message || defaultConfig.welcome_message],
        ["bot_name", config.bot_name || defaultConfig.bot_name],
        ["footer_text", config.footer_text || defaultConfig.footer_text]
    ]);
}

if (window.elementSdk) {
    window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities,
        mapToEditPanelValues
    });
}

document.addEventListener('DOMContentLoaded', initializeChat);