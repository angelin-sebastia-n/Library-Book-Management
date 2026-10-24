
import { useEffect, useState } from "react";
import "./index.css";

const API = "https://library-book-management-8srq.onrender.com/api/books";

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  genre: "",
  copiesAvailable: 1,
  shelfLocation: ""
};

export default function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadBooks(searchText = search) {
    setLoading(true);

    try {
      const response = await fetch(
        `${API}?search=${encodeURIComponent(searchText)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load books.");
      }

      setBooks(data);
      setMessage("");
    } catch (error) {
      setMessage(
        error.message || "Cannot connect to the server. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks("");
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  }

  async function saveBook(event) {
    event.preventDefault();
    setMessage("");

    const url = editingId ? `${API}/${editingId}` : API;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          copiesAvailable: Number(form.copiesAvailable)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save book.");
      }

      setMessage(
        editingId
          ? "Book updated successfully."
          : "Book added successfully."
      );

      setForm({ ...emptyBook });
      setEditingId(null);
      await loadBooks();
    } catch (error) {
      setMessage(error.message || "Unable to save book.");
    }
  }

  function editBook(book) {
    setEditingId(book._id);

    setForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      genre: book.genre || "",
      copiesAvailable: book.copiesAvailable ?? 1,
      shelfLocation: book.shelfLocation || ""
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function changeCopies(id, action) {
    setMessage("");

    try {
      const response = await fetch(`${API}/${id}/${action}`, {
        method: "PATCH"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update copies.");
      }

      setMessage(
        action === "issue"
          ? "Book issued successfully."
          : "Book returned successfully."
      );

      await loadBooks();
    } catch (error) {
      setMessage(error.message || "Unable to update copies.");
    }
  }

  async function deleteBook(book) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`${API}/${book._id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete book.");
      }

      setMessage("Book deleted successfully.");
      await loadBooks();
    } catch (error) {
      setMessage(error.message || "Unable to delete book.");
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setForm({ ...emptyBook });
    setMessage("");
  }

  const totalCopies = books.reduce(
    (total, book) => total + Number(book.copiesAvailable || 0),
    0
  );

  const unavailableTitles = books.filter(
    (book) => Number(book.copiesAvailable) === 0
  ).length;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">LB</div>

        <div>
          <p className="small-title">LIBRARY MANAGEMENT SYSTEM</p>
          <h1>Library Book Management</h1>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <p className="small-title">YOUR LIBRARY, ORGANIZED</p>
          <h2>Every book has a story.</h2>
          <p>
            Add books, manage stock, and issue or return copies easily.
          </p>
        </section>

        <section className="stats">
          <article className="stat">
            <span>Total book titles</span>
            <strong>{books.length}</strong>
          </article>

          <article className="stat">
            <span>Copies available</span>
            <strong>{totalCopies}</strong>
          </article>

          <article className="stat">
            <span>Unavailable titles</span>
            <strong>{unavailableTitles}</strong>
          </article>
        </section>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}

        <div className="layout">
          <section className="panel">
            <h2>{editingId ? "Edit Book" : "Add New Book"}</h2>

            <form onSubmit={saveBook}>
              <label>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Author
                <input
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                ISBN
                <input
                  name="isbn"
                  value={form.isbn}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Genre
                <input
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Copies Available
                <input
                  name="copiesAvailable"
                  type="number"
                  min="0"
                  step="1"
                  value={form.copiesAvailable}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Shelf Location
                <input
                  name="shelfLocation"
                  value={form.shelfLocation}
                  onChange={handleChange}
                  required
                />
              </label>

              <button className="primary" type="submit">
                {editingId ? "Save Changes" : "Add Book"}
              </button>

              {editingId && (
                <button
                  className="secondary"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </section>

          <section className="panel catalogue">
            <h2>Book Catalogue</h2>

            <input
              className="search"
              placeholder="Search by title or author..."
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                loadBooks(value);
              }}
            />

            {loading ? (
              <p>Loading books...</p>
            ) : books.length === 0 ? (
              <p className="empty">
                No books found. Add your first book!
              </p>
            ) : (
              <div className="book-list">
                {books.map((book) => (
                  <article className="book" key={book._id}>
                    <div className="book-icon">▤</div>

                    <div className="book-details">
                      <h3>{book.title}</h3>
                      <p>by {book.author}</p>
                      <p>Genre: {book.genre}</p>
                      <p>ISBN: {book.isbn}</p>
                      <p>Shelf: {book.shelfLocation}</p>

                      <p
                        className={
                          Number(book.copiesAvailable) === 0
                            ? "out"
                            : "available"
                        }
                      >
                        {Number(book.copiesAvailable) === 0
                          ? "Out of stock"
                          : `${book.copiesAvailable} copies available`}
                      </p>

                      <div className="actions">
                        <button
                          className="issue"
                          type="button"
                          disabled={Number(book.copiesAvailable) === 0}
                          onClick={() =>
                            changeCopies(book._id, "issue")
                          }
                        >
                          Issue
                        </button>

                        <button
                          className="return"
                          type="button"
                          onClick={() =>
                            changeCopies(book._id, "return")
                          }
                        >
                          Return
                        </button>

                        <button
                          className="secondary"
                          type="button"
                          onClick={() => editBook(book)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete"
                          type="button"
                          onClick={() => deleteBook(book)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer>
          Library Book Management · Built with the MERN Stack
        </footer>
      </main>
    </div>
  );
}
