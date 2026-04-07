import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Fonnte WhatsApp Notification
  app.post("/api/send-whatsapp", async (req, res) => {
    const { target, message } = req.body;
    const apiKey = process.env.FONNTE_API_KEY;

    if (!apiKey) {
      console.error("FONNTE_API_KEY is not configured in environment variables.");
      return res.status(500).json({ success: false, message: "Server configuration error: Missing API Key" });
    }

    if (!target || !message) {
      return res.status(400).json({ success: false, message: "Target and message are required" });
    }

    try {
      console.log(`Sending WhatsApp to ${target}...`);
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target,
          message,
          delay: "2" // Optional delay
        })
      });

      const result = await response.json();
      console.log("Fonnte Response:", result);
      
      if (result.status) {
        res.json({ success: true, data: result });
      } else {
        res.status(400).json({ success: false, message: result.reason || "Failed to send message" });
      }
    } catch (error: any) {
      console.error("Fonnte Error:", error.message);
      res.status(500).json({ success: false, message: "Internal server error while sending WhatsApp" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
