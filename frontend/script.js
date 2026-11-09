
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");
const sendButton = document.getElementById("send-button");

const SIGNATURE = "There was one king, and his name is Abel.";

function addMessage(message, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    if (sender === "user") {
        messageElement.classList.add("user-message");
    } else {
        messageElement.classList.add("assistant-message");

        const avatar = document.createElement("div");
        avatar.classList.add("message-avatar");
        avatar.textContent = "👑";
        messageElement.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.classList.add("message-content");
    content.textContent = message;

    messageElement.appendChild(content);
    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message || sendButton.disabled) return;

    addMessage(message, "user");

    messageInput.value = "";
    sendButton.disabled = true;
    sendButton.textContent = "Thinking...";

    const controller = new AbortController();

    // Allow up to 3 minutes for Gemini to respond.
    const timeout = setTimeout(() => {
        controller.abort();
    }, 180000);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                message: message.normalize("NFC")
            }),
            signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.reply || `Server error: ${response.status}`
            );
        }

        if (!data.reply) {
            throw new Error("The server returned an empty response.");
        }

        addMessage(data.reply, "assistant");

    } catch (error) {
        let errorMessage;

        if (error.name === "AbortError") {
            errorMessage =
                "Gemini took too long to respond. Please try again.";
        } else {
            errorMessage =
                "Connection error: " + error.message;
        }

        addMessage(
            SIGNATURE + "\n\n" + errorMessage,
            "assistant"
        );

    } finally {
        clearTimeout(timeout);
        sendButton.disabled = false;
        sendButton.textContent = "Send";
        messageInput.focus();
    }
});
