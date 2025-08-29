import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadCloud, Youtube, FileText, File, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

export default function UploadDialog({ fetchDocs }) {
  const { getToken } = useAuth();

  const [activeTab, setActiveTab] = useState("youtube");
  const [openDialog, setOpenDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [youtubeLink, setYoutubeLink] = useState("");
  const [file, setFile] = useState(null);
  const [textTitle, setTextTitle] = useState(""); //  New state for text title
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (uploading) return;
    const token = await getToken();

    let endpoint = "";
    let payload = null;

    try {
      setUploading(true);

      if (activeTab === "youtube") {
        if (!youtubeLink) return toast.error("Please provide a YouTube link.");
        endpoint = "/api/yt";
        payload = { link: youtubeLink };
      } else if (activeTab === "pdf") {
        if (!file) return toast.error("Please select a PDF file.");
        endpoint = "/api/pdf";
        const formData = new FormData();
        formData.append("file", file);
        payload = formData;
      } else if (activeTab === "text") {
        if (!textTitle) return toast.error("Please provide a title.");
        if (!textContent) return toast.error("Please provide some text.");
        endpoint = "/api/text";
        payload = { title: textTitle, text: textContent }; // ✅ Send title + text
      }

      await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            activeTab === "pdf" ? "multipart/form-data" : "application/json",
        },
      });

      toast.success(
        activeTab === "youtube"
          ? "YouTube link uploaded "
          : activeTab === "pdf"
          ? "PDF uploaded 📄"
          : "Text uploaded ✨"
      );

      setOpenDialog(false);

      await fetchDocs();
      
      // Reset inputs
      setYoutubeLink("");
      setFile(null);
      setTextTitle("");
      setTextContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("❌ Upload Error:", err);
      toast.error(err.response?.data?.message || "Upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-black hover:bg-gray-200 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300"
        >
          <UploadCloud className="mr-2 h-5 w-5" />
          Upload New Content
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Choose Your Content Type
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload a PDF, paste a YouTube link, or write plain text.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="youtube"
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-[rgb(48,48,48)] border-gray-800">
            <TabsTrigger value="youtube">
              <Youtube className="w-4 h-4 mr-2" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <File className="w-4 h-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="w-4 h-4 mr-2" />
              Text
            </TabsTrigger>
          </TabsList>

          {/* YouTube Upload */}
          <TabsContent value="youtube" className="py-4">
            <Label htmlFor="youtube-link">YouTube Video Link</Label>
            <Input
              id="youtube-link"
              placeholder="https://youtube.com/..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="bg-[rgb(48,48,48)] border-gray-700"
            />
          </TabsContent>

          {/* PDF Upload */}
          <TabsContent value="pdf" className="py-4">
            <div
              className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer bg-[rgb(48,48,48)] hover:bg-[rgb(60,60,60)] transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0])
                  setFile(e.dataTransfer.files[0]);
              }}
            >
              {file ? (
                <div className="text-center p-4">
                  <File className="mx-auto h-12 w-12 text-white" />
                  <p className="mt-2 font-semibold text-gray-300 break-all">
                    {file.name}
                  </p>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 text-gray-500 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-600" />
                  <p className="mt-2 text-sm text-gray-400">
                    <span className="font-semibold text-white">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF (up to 5MB)</p>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </TabsContent>

          {/* Text Upload */}
          <TabsContent value="text" className="py-4 space-y-4">
            <div>
              <Label htmlFor="text-title">Title</Label>
              <Input
                id="text-title"
                placeholder="Enter a title for your text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="bg-[rgb(48,48,48)] border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="text-content">Paste Your Text</Label>
              <Textarea
                id="text-content"
                rows={8}
                placeholder="Type or paste your content here."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="bg-[rgb(48,48,48)] border-gray-700"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={handleUpload}
            type="submit"
            disabled={uploading}
            className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            {uploading && (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            )}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
