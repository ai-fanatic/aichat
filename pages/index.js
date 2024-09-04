import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import {
  Settings,
  Send,
  Github,
  Twitter,
  Linkedin,
  MessageSquare,
  Image as ImageIcon,
  Music,
  Mic,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Download,
  Trash2,
  Edit2,
  X,
  Plus,
} from "lucide-react";
import Image from "next/image";
import Head from "next/head";

const providers = {
  chat: [
    { name: "ChatGPT", models: ["gpt-3.5-turbo", "gpt-4"] },
    {
      name: "Perplexity",
      models: ["llama-3.1-sonar-small-128k-online", "mistral-7b-instruct"],
    },
    { name: "Claude", models: ["claude-2", "claude-instant-1"] },
    {
      name: "Mistral",
      models: ["mistral-tiny", "mistral-small", "mistral-medium"],
    },
  ],
  image: [
    { name: "DALL-E", models: ["dall-e-2", "dall-e-3"] },
    {
      name: "Stable Diffusion",
      models: ["stable-diffusion-v1-5", "stable-diffusion-v2-1"],
    },
    { name: "Midjourney", models: ["mj-v4", "mj-v5"] },
  ],
  music: [
    { name: "Suno AI", models: ["bark", "musicgen"] },
    { name: "Replicate", models: ["riffusion", "musicgen"] },
  ],
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fontFamily, setFontFamily] = useState("inter");
  const [textColor, setTextColor] = useState("text-gray-800");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentOperation, setCurrentOperation] = useState("chat");
  const [currentProvider, setCurrentProvider] = useState(
    providers.chat[1].name
  );
  const [currentModel, setCurrentModel] = useState(providers.chat[1].models[0]);
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const speechRecognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const [newsCategory, setNewsCategory] = useState("");
  const [customNewsPrompt, setCustomNewsPrompt] = useState("");
  const [newsCategories, setNewsCategories] = useState([
    "World News",
    "US News",
    "US Politics",
    "AI News",
    "India News",
    "India Politics",
    "Andhra Pradesh News",
    "Telangana News",
    "Sports News from US and India",
  ]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("aiSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setFontFamily(parsedSettings.fontFamily || "inter");
      setTextColor(parsedSettings.textColor || "text-gray-800");
      setIsDarkMode(parsedSettings.isDarkMode || false);
    }

    // Initialize speech recognition
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.onresult = handleSpeechResult;
    }

    // Initialize speech synthesis and get available voices
    speechSynthesisRef.current = window.speechSynthesis;
    const updateVoices = () => {
      const voices = speechSynthesisRef.current.getVoices();
      setAvailableVoices(voices);
      const googleUSVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") && voice.lang.startsWith("en-US")
      );
      if (googleUSVoice) {
        setSelectedVoice(googleUSVoice.name);
      } else if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0].name);
      }
    };
    speechSynthesisRef.current.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const saveSettings = () => {
    const settings = {
      fontFamily,
      textColor,
      isDarkMode,
    };
    localStorage.setItem("aiSettings", JSON.stringify(settings));
    setSettingsSaved(true);
    setIsSettingsOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleOperationChange = (operation) => {
    setCurrentOperation(operation);
    if (operation === "chat") {
      setCurrentProvider(providers.chat[0].name);
      setCurrentModel(providers.chat[0].models[0]);
    } else if (operation === "image") {
      setCurrentProvider(providers.image[0].name);
      setCurrentModel(providers.image[0].models[0]);
    } else if (operation === "music") {
      setCurrentProvider(providers.music[0].name);
      setCurrentModel(providers.music[0].models[0]);
    } else if (operation === "news") {
      setCurrentProvider("Perplexity");
      setCurrentModel("llama-3.1-sonar-small-128k-online");
    }
  };

  const handleProviderChange = (provider) => {
    setCurrentProvider(provider);
    setCurrentModel(
      providers[currentOperation].find((p) => p.name === provider).models[0]
    );
    const savedApiKey = localStorage.getItem(`${provider}ApiKey`);
    if (!savedApiKey) {
      setIsApiKeyModalOpen(true);
    } else {
      setApiKey(savedApiKey);
    }
  };

  const handleModelChange = (model) => {
    setCurrentModel(model);
  };

  const saveApiKey = () => {
    localStorage.setItem(`${currentProvider}ApiKey`, apiKey);
    setIsApiKeyModalOpen(false);
  };

  const sendMessage = async () => {
    const savedApiKey = localStorage.getItem(`${currentProvider}ApiKey`);
    if (!input.trim() || !savedApiKey) {
      if (!savedApiKey) {
        setIsApiKeyModalOpen(true);
      }
      return;
    }

    setIsLoading(true);
    const newMessage = { role: "user", content: input };
    const updatedHistory = [...conversationHistory, newMessage];
    setConversationHistory(updatedHistory);
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: currentOperation,
          provider: currentProvider,
          model: currentModel,
          messages: updatedHistory,
          apiKey: savedApiKey,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const assistantMessage = { role: "assistant", content: data.response };
      setConversationHistory((prev) => [...prev, assistantMessage]);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      speechRecognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSpeechResult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");
    setInput(transcript);
  };

  const toggleTextToSpeech = (text) => {
    if (isPlaying) {
      speechSynthesisRef.current.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = availableVoices.find((v) => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onend = () => setIsPlaying(false);
      speechSynthesisRef.current.speak(utterance);
      setIsPlaying(true);
    }
  };

  const downloadChatHistory = () => {
    const chatContent = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");
    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat_history.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  const handleNewsCategorySelect = async (category) => {
    setNewsCategory(category);
    const newMessage = {
      role: "user",
      content: `Generate a brief summary of the latest ${category}`,
    };
    setMessages((prev) => [...prev, newMessage]);
    setConversationHistory((prev) => [...prev, newMessage]);
    setInput("");

    setIsLoading(true);
    try {
      const savedApiKey = localStorage.getItem(`PerplexityApiKey`);
      if (!savedApiKey) {
        setIsApiKeyModalOpen(true);
        return;
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "news",
          provider: "Perplexity",
          model: "llama-3.1-sonar-small-128k-online",
          messages: [...conversationHistory, newMessage],
          apiKey: savedApiKey,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const assistantMessage = { role: "assistant", content: data.response };
      setConversationHistory((prev) => [...prev, assistantMessage]);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomNewsPrompt = async () => {
    if (customNewsPrompt.trim()) {
      setNewsCategories([...newsCategories, customNewsPrompt]);
      setCustomNewsPrompt("");
      await handleNewsCategorySelect(customNewsPrompt);
    }
  };

  const deleteNewsCategory = (index) => {
    setNewsCategories(newsCategories.filter((_, i) => i !== index));
  };

  const startEditingCategory = (index) => {
    setEditingCategory(index);
    setNewCategoryName(newsCategories[index]);
  };

  const saveEditedCategory = () => {
    if (newCategoryName.trim()) {
      const updatedCategories = [...newsCategories];
      updatedCategories[editingCategory] = newCategoryName;
      setNewsCategories(updatedCategories);
    }
    setEditingCategory(null);
    setNewCategoryName("");
  };

  return (
    <>
      <Head>
        <title>AI Fusion Hub</title>
        <meta
          name="description"
          content="AI Fusion Hub - Your futuristic AI interaction platform"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div
        className={`min-h-screen flex flex-col ${
          isDarkMode
            ? "bg-gray-900 text-cyan-300"
            : "bg-gradient-to-br from-indigo-900 to-purple-900 text-cyan-100"
        } relative font-orbitron transition-colors duration-300`}
      >
        <div className="absolute inset-0 bg-[url('/circuit-board.svg')] opacity-10"></div>
        <div className="relative z-10 flex flex-col min-h-screen">
          <header
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-black"
            } bg-opacity-70 shadow-lg p-4 transition-colors duration-300`}
          >
            <h1 className="text-4xl font-bold text-center text-cyan-400 tracking-wider">
              AI Fusion Hub
            </h1>
          </header>

          <main className="flex-grow flex flex-col items-center justify-center p-4">
            <div
              className={`w-full max-w-4xl ${
                isDarkMode ? "bg-gray-800" : "bg-black"
              } bg-opacity-70 rounded-lg shadow-xl p-6 backdrop-blur-sm transition-colors duration-300 border border-cyan-500`}
            >
              <div className="mb-4 flex justify-center space-x-4">
                <button
                  className={`p-2 ${
                    currentOperation === "chat"
                      ? "bg-cyan-500 text-black"
                      : "bg-gray-700 text-cyan-300"
                  } rounded-md transition-colors duration-200`}
                  onClick={() => handleOperationChange("chat")}
                >
                  <MessageSquare className="h-6 w-6" />
                </button>
                <button
                  className={`p-2 ${
                    currentOperation === "image"
                      ? "bg-cyan-500 text-black"
                      : "bg-gray-700 text-cyan-300"
                  } rounded-md transition-colors duration-200`}
                  onClick={() => handleOperationChange("image")}
                >
                  <ImageIcon className="h-6 w-6" />
                </button>
                <button
                  className={`p-2 ${
                    currentOperation === "music"
                      ? "bg-cyan-500 text-black"
                      : "bg-gray-700 text-cyan-300"
                  } rounded-md transition-colors duration-200`}
                  onClick={() => handleOperationChange("music")}
                >
                  <Music className="h-6 w-6" />
                </button>
                <button
                  className={`p-2 ${
                    currentOperation === "news"
                      ? "bg-cyan-500 text-black"
                      : "bg-gray-700 text-cyan-300"
                  } rounded-md transition-colors duration-200`}
                  onClick={() => handleOperationChange("news")}
                >
                  <Newspaper className="h-6 w-6" />
                </button>
              </div>

              {currentOperation !== "news" && (
                <div className="mb-4 flex justify-between">
                  <select
                    className="p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                    value={currentProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    {providers[currentOperation].map((provider) => (
                      <option key={provider.name} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                    value={currentModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                  >
                    {providers[currentOperation]
                      .find((p) => p.name === currentProvider)
                      .models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {currentOperation === "news" && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-300">
                    News Categories
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {newsCategories.map((category, index) => (
                      <div
                        key={index}
                        className="relative p-2 bg-cyan-500 text-black rounded-md hover:bg-cyan-600 transition-colors duration-200"
                      >
                        {editingCategory === index ? (
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onBlur={saveEditedCategory}
                            onKeyPress={(e) =>
                              e.key === "Enter" && saveEditedCategory()
                            }
                            className="w-full bg-transparent border-none focus:outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => handleNewsCategorySelect(category)}
                            className="w-full text-left"
                          >
                            {category}
                          </button>
                        )}
                        <button
                          onClick={() => deleteNewsCategory(index)}
                          className="absolute top-1 right-1 text-black hover:text-gray-800"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => startEditingCategory(index)}
                          className="absolute bottom-1 right-1 text-black hover:text-gray-800"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      className="w-full p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                      value={customNewsPrompt}
                      onChange={(e) => setCustomNewsPrompt(e.target.value)}
                      placeholder="Enter new news category..."
                    />
                    <button
                      className="mt-2 p-2 bg-cyan-500 text-black rounded-md hover:bg-cyan-600 transition-colors duration-200"
                      onClick={handleCustomNewsPrompt}
                    >
                      Add News Category
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <button
                  className={`flex items-center text-cyan-300 font-semibold`}
                  onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                >
                  About this project
                  {isAboutExpanded ? (
                    <ChevronUp className="ml-2" />
                  ) : (
                    <ChevronDown className="ml-2" />
                  )}
                </button>
                {isAboutExpanded && (
                  <div
                    className={`mt-2 p-4 rounded-md ${
                      isDarkMode ? "bg-gray-800" : "bg-black"
                    } bg-opacity-70 border border-cyan-500`}
                  >
                    <p className="text-cyan-100">
                      AI Fusion Hub is an all-in-one platform that integrates
                      various AI services, including chat, image generation, and
                      music creation. It provides a unified interface to
                      interact with multiple AI providers, allowing users to
                      explore and compare different AI capabilities seamlessly.
                      With features like speech-to-text input and text-to-speech
                      output, AI Fusion Hub offers a comprehensive and
                      accessible AI experience for users of all levels.
                    </p>
                  </div>
                )}
              </div>

              <div className="h-96 mb-4 p-4 border border-cyan-500 rounded-md overflow-auto bg-black bg-opacity-50">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      msg.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-cyan-100 text-gray-800"
                          : "bg-gray-800 text-cyan-100"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <>
                          <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="mb-2" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-4 mb-2"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal pl-4 mb-2"
                                  {...props}
                                />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="mb-1" {...props} />
                              ),
                              h1: ({ node, ...props }) => (
                                <h1
                                  className="text-2xl font-bold mb-2"
                                  {...props}
                                />
                              ),
                              h2: ({ node, ...props }) => (
                                <h2
                                  className="text-xl font-bold mb-2"
                                  {...props}
                                />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3
                                  className="text-lg font-bold mb-2"
                                  {...props}
                                />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-bold" {...props} />
                              ),
                              em: ({ node, ...props }) => (
                                <em className="italic" {...props} />
                              ),
                              code: ({ node, inline, ...props }) =>
                                inline ? (
                                  <code
                                    className="bg-gray-200 rounded px-1"
                                    {...props}
                                  />
                                ) : (
                                  <code
                                    className="block bg-gray-200 rounded p-2 my-2"
                                    {...props}
                                  />
                                ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          <button
                            className="mt-2 p-1 bg-cyan-500 text-black rounded-full"
                            onClick={() => toggleTextToSpeech(msg.content)}
                          >
                            {isPlaying ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center items-center h-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                  </div>
                )}
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="text"
                  className="flex-grow p-2 bg-gray-800 border border-cyan-500 rounded-l-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                />
                <button
                  className={`p-2 ${
                    isListening ? "bg-red-500" : "bg-cyan-500"
                  } text-black rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-colors duration-200 ml-2`}
                  onClick={toggleSpeechRecognition}
                >
                  <Mic className="h-6 w-6" />
                </button>
                <button
                  className={`p-2 ${
                    isDarkMode ? "bg-cyan-600" : "bg-cyan-500"
                  } text-black rounded-r-md focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-colors duration-200 ml-2`}
                  onClick={sendMessage}
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>

              <div className="flex justify-between">
                <button
                  className="p-2 bg-cyan-500 text-black rounded-md hover:bg-cyan-600 transition-colors duration-200"
                  onClick={downloadChatHistory}
                >
                  <Download className="h-6 w-6" />
                </button>
                <button
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                  onClick={clearChat}
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            <button
              className="fixed top-4 right-4 p-2 bg-cyan-500 text-black rounded-full shadow-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-cyan-500 transition-colors duration-200"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="h-6 w-6" />
            </button>

            {isSettingsOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div
                  className={`${
                    isDarkMode
                      ? "bg-gray-800 text-cyan-300"
                      : "bg-black text-cyan-100"
                  } p-6 rounded-lg shadow-xl max-w-md w-full transition-colors duration-300 border border-cyan-500`}
                >
                  <h2 className={`text-xl font-semibold text-cyan-400 mb-4`}>
                    Settings
                  </h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cyan-300 mb-1">
                      Font Family
                    </label>
                    <select
                      className="w-full p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="lato">Lato</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cyan-300 mb-1">
                      Text Color
                    </label>
                    <select
                      className="w-full p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    >
                      <option value="text-gray-800">Dark Gray</option>
                      <option value="text-gray-600">Medium Gray</option>
                      <option value="text-teal-800">Dark Teal</option>
                      <option value="text-cyan-800">Dark Cyan</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Text-to-Speech Voice
                    </label>
                    <select
                      className="w-full p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100"
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                      {availableVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {settingsSaved && (
                    <p className="text-green-500 mb-4">
                      Settings saved successfully!
                    </p>
                  )}
                  <div className="flex justify-between">
                    <button
                      className={`p-2 ${
                        isDarkMode
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "bg-cyan-500 hover:bg-cyan-600"
                      } text-black rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-colors duration-200`}
                      onClick={saveSettings}
                    >
                      Save Settings
                    </button>
                    <button
                      className={`p-2 ${
                        isDarkMode
                          ? "bg-gray-700 text-cyan-300 hover:bg-gray-600"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200`}
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isApiKeyModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div
                  className={`${
                    isDarkMode
                      ? "bg-gray-800 text-cyan-300"
                      : "bg-black text-cyan-100"
                  } p-6 rounded-lg shadow-xl max-w-md w-full transition-colors duration-300 border border-cyan-500`}
                >
                  <h2 className={`text-xl font-semibold text-cyan-400 mb-4`}>
                    Enter API Key for {currentProvider}
                  </h2>
                  <input
                    type="password"
                    className="w-full p-2 bg-gray-800 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 text-cyan-100 mb-4"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter ${currentProvider} API key`}
                  />
                  <div className="flex justify-between">
                    <button
                      className={`p-2 ${
                        isDarkMode
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "bg-cyan-500 hover:bg-cyan-600"
                      } text-black rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-colors duration-200`}
                      onClick={saveApiKey}
                    >
                      Save API Key
                    </button>
                    <button
                      className={`p-2 ${
                        isDarkMode
                          ? "bg-gray-700 text-cyan-300 hover:bg-gray-600"
                          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200`}
                      onClick={() => setIsApiKeyModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          <footer
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-black"
            } bg-opacity-70 shadow-lg p-4 mt-8 transition-colors duration-300`}
          >
            <div className="flex justify-center space-x-4">
              <a
                href="https://github.com/ai-fanatic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-500 transition-colors duration-200"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com/navaifanatic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-500 transition-colors duration-200"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="https://linkedin.com/in/nchatlapalli"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-500 transition-colors duration-200"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              {/* <a
                href="https://naveen.aifanatic.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-500 transition-colors duration-200"
              >
                <Image
                  src="/path/to/icon.png"
                  alt="Portfolio Icon"
                  width={24}
                  height={24}
                />
              </a> */}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
