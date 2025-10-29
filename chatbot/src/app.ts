import express from "express";
import cors from "cors";
import botQa from "./routes/botQa";
import { AppDataSource } from "./dbconfig";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/chatbot", botQa);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected!");
  })
  .catch((error) => console.log("❌ DB Connection Error: ", error));
