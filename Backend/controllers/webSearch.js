import { Exa } from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

const webSearch = async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query must be a string" });
  }

  try {
    // Pass query as a string, not an object
    const result = await exa.answer(query);

    res.json(
      result
    );
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};

export default webSearch;
