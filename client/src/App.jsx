

import { Button } from "./components/ui/button";
import GetDocs from "./Pages/GetDocs";
import ChatPage from "./Pages/ChatPage"
import Home from "./Pages/Home";
import { Route, Routes } from "react-router-dom";
// import Docs from "./Pages/Docs";
import { Toaster } from "react-hot-toast";
function App() {
  

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/GetDocs" element={<GetDocs />} />
        <Route path="/Chat" element={<ChatPage />} />
      </Routes>
    </>
  );
}

export default App;
