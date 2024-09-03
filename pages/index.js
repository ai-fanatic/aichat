import React, { useState } from "react";
import { Settings, Send, Copy, Github, Twitter, Linkedin } from "lucide-react";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    setIsLoading(true);
    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert("API key copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100">
      <header className="bg-white shadow-md p-4">
        <h1 className="text-3xl font-bold text-center text-purple-600">
          Perplexity AI Chat Explorer
        </h1>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-purple-600 mb-2">
              Chat with Perplexity AI
            </h2>
            <p className="text-gray-600">
              Explore the capabilities of Perplexity AI through this interactive
              chat interface.
            </p>
          </div>

          <div className="h-96 mb-4 p-4 border rounded-md overflow-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.role === "user" ? "bg-purple-100" : "bg-blue-100"
                  }`}
                >
                  {msg.content}
                </span>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
            />
            <button
              className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-purple-300"
              onClick={sendMessage}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="mt-8 w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-purple-600 mb-2">
            About This Project
          </h2>
          <p className="text-gray-600">
            This chat interface was created to demonstrate the integration of
            Perplexity AI's API with a Next.js application. It showcases
            real-time AI interactions and modern web development practices.
          </p>
        </div>
      </main>

      <footer className="bg-white shadow-md p-4 mt-8">
        <div className="flex justify-center space-x-4">
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-purple-600"
          >
            <Github className="h-6 w-6" />
          </a>
          <a
            href="https://twitter.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-purple-600"
          >
            <Twitter className="h-6 w-6" />
          </a>
          <a
            href="https://linkedin.com/in/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-purple-600"
          >
            <Linkedin className="h-6 w-6" />
          </a>
        </div>
      </footer>

      <button
        className="fixed top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        <Settings className="h-6 w-6 text-purple-600" />
      </button>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-purple-600 mb-4">
              API Settings
            </h2>
            <input
              type="password"
              className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
            <div className="flex justify-between">
              <button
                className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
                onClick={copyApiKey}
              >
                <Copy className="h-5 w-5 mr-2 inline-block" /> Copy API Key
              </button>
              <button
                className="p-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => setIsSettingsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
