// import YoutubeCard from "../components/YoutubeCard";
// import { FileText, Loader2 } from "lucide-react"; // Imported Loader2 for the loading state
// import axios from "axios";
// import { useState } from "react";
// // import { useAuth } from "@clerk/clerk-react";
// import { Toaster, toast } from "react-hot-toast"; // 1. Import Toaster and toast

// export default function DocsGrid({ data ,onDelete}) {
//   const allDocs = [
//     ...(data.youtube || []).map((doc) => ({ ...doc, type: "youtube" })),
//     ...(data.pdf || []).map((doc) => ({ ...doc, type: "pdf" })),
//     ...(data.text || []).map((doc) => ({ ...doc, type: "text" })),
//   ];

//   axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
//   const [loading, setLoading] = useState(false);
//   // const { getToken } = useAuth();

//   // // 2. Corrected handleDelete function
//   // const handleDelete = async (type, _id) => {
//   //   // We use a toast promise for a clean loading/success/error state
//   //   toast.promise(
//   //     (async () => {
//   //       try {
//   //         setLoading(true);
//   //         const token = await getToken(); // Make sure to 'await' the token
//   //         console.log("Token:", token);
//   //         // The fix: `headers` and `data` must be configured correctly for axios.delete
//   //         const response = await axios.delete("/api/delete", {
//   //           headers: {
//   //             Authorization: `Bearer ${token}`,
//   //           },
//   //           data: {
//   //             type: type,
//   //             mongo_id: _id,
//   //           },
//   //         });

//   //         if (response) {
//   //           console.log("Deleted:", response);
//   //           // NOTE: You'll likely want to refresh your data here after a successful delete
//   //           return response;
//   //         }
//   //       } catch (e) {
//   //         console.error("Delete error:", e);
//   //         // Re-throw the error to let the toast promise know it failed
//   //         throw new Error("Deletion failed. Check console for details.");
//   //       } finally {
//   //         setLoading(false);
//   //       }
//   //     })(),
//   //     {
//   //       loading: "Deleting...",
//   //       success: <b>Successfully deleted!</b>,
//   //       error: <b>Could not delete.</b>,
//   //     }
//   //   );
//   // };

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <Loader2 className="h-6 w-6 animate-spin text-white" />
//       </div>
//     );

//   const handleView = async (link) => {
//     window.open(link, "_blank");
//   };

//   if (!allDocs.length) {
//     return (
//       <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:p-8">
//         <div className="col-span-full text-center text-gray-500">
//           <p>
//             No documents uploaded yet. Click "Upload New Content" to get
//             started.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:p-8">
//       {/* 3. Add the Toaster component here */}
//       <Toaster position="top-center" reverseOrder={false} />

//       <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-6">
//         {allDocs.map((doc) => {
//           if (doc.type === "youtube")
//             return (
//               <YoutubeCard
//                 key={doc._id}
//                 metadata={{ title: doc.title, description: doc.description }}
//                 link={doc.link}
//                 onDelete={onDelete}
//                 onView={() => handleView(doc.link)}
//               />
//             );

//           if (doc.type === "pdf")
//             return (
//               <div
//                 key={doc._id}
//                 className="bg-gray-800 p-4 rounded-lg flex flex-col justify-center items-center text-center"
//               >
//                 <FileText className="w-10 h-10 mx-auto text-blue-400 mb-2" />
//                 <p
//                   className="text-sm font-semibold truncate w-full"
//                   title={doc.filename}
//                 >
//                   {doc.filename}
//                 </p>
//               </div>
//             );

//           if (doc.type === "text")
//             return (
//               <div
//                 key={doc._id}
//                 className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between"
//               >
//                 <FileText className="w-10 h-10 mx-auto text-green-400 mb-2" />
//                 <p className="text-left text-xs text-gray-300 overflow-hidden text-ellipsis line-clamp-4">
//                   {doc.content}
//                 </p>
//               </div>
//             );

//           return null;
//         })}
//       </div>
//     </div>
//   );
// }
