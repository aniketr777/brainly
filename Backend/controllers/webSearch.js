import axios from "axios";

const url = "https://www.searchapi.io/api/v1/search";

const search = async (query) => {
  try {
    const params = {
      engine: "google",
      q: query, 
      api_key: process.env.DUCKDUCKGO, 
    };
    console.log("params",params);
    const response = await axios.get(url, { params }); 
    console.log(response.data);
    return response.data; 
  } catch (error) {
    console.error("Error during search:", error.message);
    throw error;
  }
};

const webSearch = async(req,res) =>{
  const {query} = req.body;
    try{
      const result = await search(query);
      return result;
    }catch(e){
      console.log(e);
    }
}
export default webSearch;