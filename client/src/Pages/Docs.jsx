
import PdfViewer from "../components/PdfViewer";
import { useParams } from "react-router-dom";

function Docs() {
  const {id} =  useParams();
  return <div>
    <PdfViewer id={id} />
  </div>;
}

export default Docs;
