import { SarvamAIClient } from "sarvamai";
import { Readable } from "stream";

export const convertor = async (req, res) => {
  try {
    const audio = req.file;
    if (!audio) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAMAI_API_KEY,
    });

    // Create a readable stream from the buffer for SarvamAI
    const audioStream = Readable.from(audio.buffer);

    const response = await client.speechToText.translate({
      file: audioStream,
    });

    const transcription = response.transcript;
    console.log("Transcription:", transcription);

    if (!transcription) {
      return res.status(500).json({ error: "Transcription failed" });
    }

    return res.status(200).json({ text: transcription });
  } catch (e) {
    console.error("Error transcribing audio:", e);
    return res.status(500).json({ error: "Failed to transcribe audio" });
  }
};
