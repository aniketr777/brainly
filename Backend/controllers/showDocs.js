import Pdf from "../model/pdf-collection.js";
const getPdf = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching PDF with ID:", id);
    const file = await Pdf.findById(id);
    console.log("Fetched PDF record:", file);
    if (!file) {
      return res.status(404).json({ error: "PDF not found" });
    }
    res.json({ fileUrl: file?.filepath });
    console.log("PDF fetched successfully:", file?.filepath);
  } catch (err) {
    console.error("Error fetching PDF:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default getPdf;
