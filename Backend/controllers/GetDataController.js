import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";

export const GetDataController = async (req, res) => {
  try {
    
    const { userId } = req.auth();

    
    const promises = [
      Youtube.find({ user_id: userId }).lean(),
      Pdf.find({ user_id: userId }).lean(),
      Text.find({ user_id: userId }).lean(),
    ];

    // Wait for all the database queries to complete.
    const [youtubeDocs, pdfDocs, textDocs] = await Promise.all(promises);

    // Combine all the results into a single object.
    const allData = {
      youtube: youtubeDocs,
      pdf: pdfDocs,
      text: textDocs,
    };

    // Send the combined data as a JSON response.
    res.json(allData);
    // console.log(allData)
  } catch (err) {
    console.error("❌ GetDataController error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
