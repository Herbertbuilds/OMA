import { GoogleGenAI } from '@google/genai';

// Configuration
const API_KEY = "AIzaSyB5xt8H2IoMCZDP8tt6nmUV-B0MbSj1ggc";

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const welcomeScreen = document.getElementById('welcomeScreen');
const typingIndicator = document.getElementById('typingIndicator');

// App State
let isFirstMessage = true;
let chat;

// Configuration object for editable content
const defaultConfig = {
    welcome_message: "👋 Hi, I'm OMA — your Old Mutual Assistant. How can I help you today?",
    bot_name: "Old Mutual Assistant (OMA)",
    footer_text: "Powered by Team Innovation – Technovation Hackathon 2025"
};

function initializeChat() {
    if (!API_KEY) {
        console.error("API Key is missing.");
        addMessage("I'm not configured correctly. My API Key is missing.", false);
        messageInput.disabled = true;
        sendButton.disabled = true;
        return;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const systemInstruction = `You are OMA, the Old Mutual Assistant, a friendly and professional financial companion from Namibians. 
        Your purpose is to assist users with their questions about Old Mutual's services, including investments, savings, and insurance. 
        Keep your answers short as possible, concise, helpful, and easy to understand for someone who might be new to finance and do not use *.
        Always be polite and encouraging. Use emojis to make the conversation friendly,🏦, 📈, 🚀, 💰, 👥, 😊, 👋, 🤝.`;

        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        messageInput.disabled = false;
        sendButton.disabled = false;
    } catch (error) {
        console.error("Failed to initialize Gemini Chat", error);
        addMessage("I couldn't start up properly. There might be an issue with my configuration or the API key.", false);
        messageInput.disabled = true;
        sendButton.disabled = true;
    }
}

function hideWelcomeScreen() {
    if (isFirstMessage) {
        welcomeScreen.style.display = 'none';
        isFirstMessage = false;
    }
}

function addMessage(content, isUser = false) {
    hideWelcomeScreen();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    if (isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `;
    } else {
        messageDiv.innerHTML = `
    <div class="bot-avatar">
        <svg viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19C3 20.1 3.9 21 5 21H11V19H5V3H13V9H21ZM14 13.5C14 11.01 16.01 9 18.5 9S23 11.01 23 13.5 20.99 18 18.5 18 14 15.99 14 13.5ZM20.5 13.5C20.5 12.4 19.6 11.5 18.5 11.5S16.5 12.4 16.5 13.5 17.4 15.5 18.5 15.5 20.5 14.6 20.5 13.5Z"/>
        </svg>
    </div>

    <div class="message-content">${content}</div>
        <br>
    <div class="bot-audio-icon">
        <svg viewBox="0 0 24 24" class="sound-icon">
            <path d="M3 10v4h4l5 5V5L7 10H3z"/>
            <path class="wave wave1" d="M14 9a3 3 0 0 1 0 6"/>
            <path class="wave wave2" d="M16 7a6 6 0 0 1 0 10"/>
        </svg>
    </div>
`;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

async function getBotResponse(userMessage) {
    if (!chat) {
        return "I'm not ready to chat yet. Please check my configuration.";
    }
    try {
        const response = await chat.sendMessage({ message: userMessage });
        return response.text;
    } catch (error) {
        console.error("Error getting bot response:", error);
        return "I'm having a bit of trouble thinking right now. This could be due to a network issue. Please try again.";
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    messageInput.value = '';

    messageInput.disabled = true;
    sendButton.disabled = true;

    showTypingIndicator();

    try {
        const botResponse = await getBotResponse(message);
        addMessage(botResponse, false);
    } catch (error) {
        console.error("Failed to send message:", error);
        addMessage("Sorry, I couldn't process that. Please try again.", false);
    } finally {
        hideTypingIndicator();
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

messageInput.addEventListener('input', () => {
    if (!messageInput.disabled) {
        sendButton.style.opacity = messageInput.value.trim() ? '1' : '0.7';
    }
});
//voice input part-------------------------------------------------
const micButton = document.getElementById("micButton");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = false;

let isRecording = false;

// Toggle mic
micButton.addEventListener("click", () => {
    if (!isRecording) {
        // START recording
        recognition.start();
        isRecording = true;
        micButton.classList.add("mic-recording");
    } else {
        // STOP recording
        recognition.stop();
        isRecording = false;
        micButton.classList.remove("mic-recording");
    }
});

// When voice is captured
recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;

    messageInput.value = speechText;

    // Activate send button
    messageInput.dispatchEvent(new Event("input"));
};

// Stop animation and reset state
recognition.onend = () => {
    isRecording = false;
    micButton.classList.remove("mic-recording");
};

// In case of error
recognition.onerror = () => {
    isRecording = false;
    micButton.classList.remove("mic-recording");
};
//--------------------end---------------------------------------------
// Element SDK implementation
async function onConfigChange(config) {
    const welcomeMessageEl = document.getElementById('welcome-message');
    const botNameEl = document.getElementById('bot-name');
    const footerTextEl = document.getElementById('footer-text');

    if (welcomeMessageEl) {
        welcomeMessageEl.textContent = config.welcome_message || defaultConfig.welcome_message;
    }
    if (botNameEl) {
        botNameEl.textContent = config.bot_name || defaultConfig.bot_name;
    }
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

// Initialize Element SDK
if (window.elementSdk) {
    window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities,
        mapToEditPanelValues
    });
}
document.addEventListener("click", (e) => {
    const icon = e.target.closest(".bot-audio-icon");
    if (!icon) return;

    // If there's already an audio element playing, stop it
    if (icon.audio && !icon.audio.paused) {
        icon.audio.pause();
        icon.audio.currentTime = 0;
        icon.classList.remove("sound-active");
        return;
    }

    // Otherwise, start new audio
    const audio = new Audio("path/to/bot_audio.mp3");
    icon.audio = audio; // store reference for stopping later
    icon.classList.add("sound-active");
    audio.play();

    audio.onended = () => {
        icon.classList.remove("sound-active");
    };
});

// Initialize with default config & start chat
onConfigChange(defaultConfig);
initializeChat();