import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";
import Web from "../model/web-collection.js";

export const GetDataController = async (req, res) => {
  try {
    const { userId } = req.auth();

    const promises = [
      Youtube.find({ user_id: userId }).lean(),
      Pdf.find({ user_id: userId }).lean(),
      Text.find({ user_id: userId }).lean(),
      Web.find({ user_id: userId }).lean(),
    ];

    const [youtubeDocs, pdfDocs, textDocs, webDocs] = await Promise.all(
      promises
    );

    const allData = {
      plan: req.plan,
      youtube: youtubeDocs,
      pdf: pdfDocs,
      text: textDocs,
      web: webDocs,
    };

    res.json(allData);
  } catch (err) {
    console.error("❌ GetDataController error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
