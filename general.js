const express = require('express');
let books = require("./booksdb.js");
let { isValid, users } = require("./auth_users.js");
const axios = require('axios');
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Username and password are required." });
  }

  if (isValid(username)) {
    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login." });
  } else {
    return res.status(404).json({ message: "User already exists!" });
  }
});

// ---------------------------------------------------------------------
// The four routes below respond directly (used by the running server).
// ---------------------------------------------------------------------

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).json(book);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const matchingBooks = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author.toLowerCase())
    .reduce((acc, isbn) => {
      acc[isbn] = books[isbn];
      return acc;
    }, {});

  if (Object.keys(matchingBooks).length > 0) {
    return res.status(200).json(matchingBooks);
  } else {
    return res.status(404).json({ message: `No books found for author '${author}'.` });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  const matchingBooks = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title.toLowerCase())
    .reduce((acc, isbn) => {
      acc[isbn] = books[isbn];
      return acc;
    }, {});

  if (Object.keys(matchingBooks).length > 0) {
    return res.status(200).json(matchingBooks);
  } else {
    return res.status(404).json({ message: `No books found with title '${title}'.` });
  }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).json(book.reviews);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

// -----------------------------------------------------------------------------
// Task 10-13: Retrieve books using Promise callbacks / async-await with Axios.
// These functions call the server's own endpoints above and can be invoked
// from a separate client script (e.g. node client.js) to demonstrate the
// promise-based / async-await approach requested by the assignment.
// -----------------------------------------------------------------------------

// Task 10: Get all books – using Promise callbacks (.then/.catch)
function getAllBooksPromise() {
  axios.get(`${BASE_URL}/`)
    .then((response) => {
      console.log("All books (Promise):", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error fetching all books:", error.message);
    });
}

// Task 11: Search by ISBN – using async/await
async function getBookByISBN(isbn) {
  try {
    const response = await axios.get(`${BASE_URL}/isbn/${isbn}`);
    console.log(`Book with ISBN ${isbn} (async/await):`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching book with ISBN ${isbn}:`, error.message);
  }
}

// Task 12: Search by author – using Promise callbacks (.then/.catch)
function getBooksByAuthor(author) {
  axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`)
    .then((response) => {
      console.log(`Books by author '${author}' (Promise):`, response.data);
      return response.data;
    })
    .catch((error) => {
      console.error(`Error fetching books by author '${author}':`, error.message);
    });
}

// Task 13: Search by title – using async/await
async function getBooksByTitle(title) {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    console.log(`Books with title '${title}' (async/await):`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching books with title '${title}':`, error.message);
  }
}

module.exports.general = public_users;
module.exports.getAllBooksPromise = getAllBooksPromise;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
