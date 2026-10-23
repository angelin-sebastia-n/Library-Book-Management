
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  genre: { type: String, required: true },
  copiesAvailable: { type: Number, required: true, min: 0 },
  shelfLocation: { type: String, required: true }
});

const Book = mongoose.model("Book", bookSchema);

app.get("/", (req, res) => {
  res.send("Library Book Management API is running!");
});

app.get("/api/books", async (req, res) => {
  try {
    const search = req.query.search || "";
    const filter = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { author: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    res.json(await Book.find(filter).sort({ title: 1 }));
  } catch {
    res.status(500).json({ message: "Unable to load books." });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      message: error.code === 11000
        ? "This ISBN already exists."
        : "Please check the book details."
    });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ message: "Book not found." });
    res.json(book);
  } catch {
    res.status(400).json({ message: "Unable to update book." });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found." });
    res.json({ message: "Book deleted successfully." });
  } catch {
    res.status(400).json({ message: "Unable to delete book." });
  }
});

app.patch("/api/books/:id/issue", async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, copiesAvailable: { $gt: 0 } },
      { $inc: { copiesAvailable: -1 } },
      { new: true }
    );
    if (!book) {
      return res.status(409).json({ message: "No copies available to issue." });
    }
    res.json(book);
  } catch {
    res.status(400).json({ message: "Unable to issue book." });
  }
});

app.patch("/api/books/:id/return", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $inc: { copiesAvailable: 1 } },
      { new: true }
    );
    if (!book) return res.status(404).json({ message: "Book not found." });
    res.json(book);
  } catch {
    res.status(400).json({ message: "Unable to return book." });
  }
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("Add MONGODB_URI to your server/.env file.");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
  });
