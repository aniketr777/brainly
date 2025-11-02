import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAMAI_API_KEY,
});

export const textToSpeech = async (req, res) => {
  const  { text } = req.body;
  try {
    const response = await client.textToSpeech.convert({
      text,
      model: "bulbul:v2",
      speaker: "anushka",
      target_language_code: "en-IN",
    });

    // Convert base64 audio to buffer
    // console.log(response.audios);
    const audioBuffer =  Buffer.from(response.audios[0], "base64");

    console.log(audioBuffer)
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });

    res.send(audioBuffer); // Send audio to frontend
  } catch (e) {
    console.log("backend", text);

    console.error("TTS failed:", e);
    res.status(500).send({ error: "Text-to-speech failed" });
  }
};

