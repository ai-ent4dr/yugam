const blob = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")], { type: "image/png" });
const formData = new FormData();
formData.append("file", blob, "profile.png");
formData.append("kind", "person-a-profile");
formData.append("consent", "true");
formData.append("analysisId", "00000000-0000-0000-0000-000000000001");

console.log("Sending upload request to https://yugam-g8o6.vercel.app/api/upload ...");
try {
  const res = await fetch("https://yugam-g8o6.vercel.app/api/upload", {
    method: "POST",
    headers: {
      "Origin": "https://yugam-g8o6.vercel.app",
    },
    body: formData,
  });

  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Response body:", text);
} catch (err) {
  console.error("Fetch failed:", err);
}
