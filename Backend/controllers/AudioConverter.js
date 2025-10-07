import fs from "fs";
import {SarvamAIClient} from "sarvamai";
import fs_promise from "fs/promises";


export const convertor = async (req, res) => {
let audioFilePath = null;
  try {
    const audio  =  req.file;
    if(!audio){
        return res.status(400).json({ error: "No audio file provided" });
    }
    const client = new SarvamAIClient({
        apiSubscriptionKey: process.env.SARVAMAI_API_KEY,
    });
    const audioFile = fs.createReadStream(audio.path);
    audioFilePath = audio.path;
    const response=await client.speechToText.translate({
      file: fs.createReadStream(audio.path),
    });

    const transcription = response.transcript;
    console.log("Transcription:", transcription);
    if(!transcription){
        return res.status(500).json({ error: "Transcription failed" });
    }
    return res.status(200).json({ text: transcription });   
  } catch (e) {
    console.error("Error transcribing audio:", e);
    return res.status(500).json({ error: "Failed to transcribe audio" });
  }finally {
    if (audioFilePath) {
      try {
        await fs_promise.unlink(audioFilePath);
        console.log("Temp audio file deleted successfully");
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }}
};
