import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";

export const GetDataController = async (req, res) => {
  try {
    // CORRECTED: Use req.auth() as a function per the warning.
    const { userId } = req.auth();

    const promises = [
      Youtube.find({ user_id: userId }).lean(),
      Pdf.find({ user_id: userId }).lean(),
      Text.find({ user_id: userId }).lean(),
    ];

    const [youtubeDocs, pdfDocs, textDocs] = await Promise.all(promises);

    const allData = {
      plan: req.plan, // This comes from your 'auth' middleware
      youtube: youtubeDocs,
      pdf: pdfDocs,
      text: textDocs,
    };
console.log(req.plan);
    res.json(allData);
  } catch (err) {
    console.error("❌ GetDataController error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
