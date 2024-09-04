import axios from "axios";

const PERPLEXITY_API_KEY =
  "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";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { operation, provider, model, messages, apiKey, chatCount } = req.body;

  // Check if the user has reached the chat limit
  if (chatCount >= 5 && !req.body.isPremium) {
    return res
      .status(402)
      .json({ error: "Chat limit reached. Please purchase credits." });
  }

  // Use the provided API key or the default one
  const usedApiKey = apiKey || PERPLEXITY_API_KEY;

  if (!usedApiKey) {
    return res.status(401).json({ error: "API key is required" });
  }

  try {
    let response;
    switch (provider) {
      case "ChatGPT":
        response = await handleOpenAI(operation, model, messages, usedApiKey);
        break;
      case "Perplexity":
        if (operation === "news") {
          response = await handleNewsGeneration(model, messages, usedApiKey);
        } else {
          response = await handlePerplexity(
            operation,
            model,
            messages,
            usedApiKey
          );
        }
        break;
      case "Claude":
        response = await handleClaude(operation, model, messages, usedApiKey);
        break;
      case "Mistral":
        response = await handleMistral(operation, model, messages, usedApiKey);
        break;
      case "DALL-E":
      case "Stable Diffusion":
      case "Midjourney":
        response = await handleImageGeneration(
          provider,
          model,
          messages,
          usedApiKey
        );
        break;
      case "Suno AI":
      case "Replicate":
        response = await handleMusicGeneration(
          provider,
          model,
          messages,
          usedApiKey
        );
        break;
      default:
        throw new Error("Unsupported provider");
    }

    // Check if the response should be formatted as a list with checkboxes
    if (messages[messages.length - 1].content.toLowerCase().includes("list")) {
      response = formatAsCheckboxList(response);
    }

    res.status(200).json({ response });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
}

function formatAsCheckboxList(text) {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return line.replace(/^[-*]\s*/, "[ ] ");
      }
      return line;
    })
    .join("\n");
}

async function handleNewsGeneration(model, messages, apiKey) {
  try {
    const lastMessage = messages[messages.length - 1].content;
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant that provides brief news summaries.",
          },
          { role: "user", content: lastMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error calling Perplexity API for news generation:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate news summary");
  }
}

async function handlePerplexity(operation, model, messages, apiKey) {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: model,
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error calling Perplexity API for chat:",
      error.response?.data || error.message
    );
    throw new Error("Failed to generate chat response");
  }
}

// ... (other handler functions remain the same, but update their parameters to accept 'messages' instead of 'message')

async function handleImageGeneration(provider, model, messages, apiKey) {
  // Implement image generation logic here
  throw new Error("Image generation not implemented yet");
}

async function handleMusicGeneration(provider, model, messages, apiKey) {
  // Implement music generation logic here
  throw new Error("Music generation not implemented yet");
}
