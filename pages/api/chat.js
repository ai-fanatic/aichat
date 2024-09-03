import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  const apiKey = req.headers.authorization?.split(" ")[1];

  if (!apiKey) {
    return res.status(401).json({ error: "API key is required" });
  }

  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    res
      .status(200)
      .json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error(
      "Error calling Perplexity API:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
}
