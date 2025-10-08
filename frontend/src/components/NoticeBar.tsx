// src/components/NoticeBar.tsx
// import { useEffect, useState } from "react";
// import { fetchPosts } from "../api/posts";
// import type { Post } from "../types";

// export default function NoticeBar() {
//   const [latest, setLatest] = useState<Post | null>(null);

//   useEffect(() => {
//     fetchPosts(1)
//       .then((rows) => setLatest(rows[0] ?? null))
//       .catch(() => setLatest(null));
//   }, []);

//   if (!latest) return null;

//   return (
//     <div style={{ background: "#fff8e1", borderBottom: "1px solid #f0e6c0" }}>
//       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 12px", display: "flex", gap: 8 }}>
//         <strong>お知らせ：</strong>
//         <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//           {latest.title}（{new Date(latest.created_at).toLocaleDateString()}）
//         </div>
//       </div>
//     </div>
//   );
// }