const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Returns true if the username is NOT already taken (i.e. valid to register)
  let userswithsamename = users.filter((user) => user.username === username);
  return userswithsamename.length === 0;
};

const authenticatedUser = (username, password) => {
  let validusers = users.filter((user) => user.username === username && user.password === password);
  return validusers.length > 0;
};

// Register a new user
regd_users.post("/register", (req, res) => {
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

// Login as a registered user
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in: username and password required." });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign(
      { data: username },
      'access',
      { expiresIn: 60 * 60 }
    );

    req.session.authorization = {
      accessToken,
      username
    };
    return res.status(200).json({ message: "User successfully logged in.", accessToken });
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password." });
  }
});

// Add or modify a book review (requires the user to be logged in)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization ? req.session.authorization['username'] : null;

  if (!username) {
    return res.status(403).json({ message: "User not logged in." });
  }

  if (!review) {
    return res.status(404).json({ message: "Review text is required as a query parameter, e.g. ?review=Great book" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  book.reviews[username] = review;

  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been added/updated.`,
    reviews: book.reviews
  });
});

// Delete a book review (only the logged-in user's own review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization ? req.session.authorization['username'] : null;

  if (!username) {
    return res.status(403).json({ message: "User not logged in." });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  if (book.reviews[username]) {
    delete book.reviews[username];
    return res.status(200).json({
      message: `The review for the book with ISBN ${isbn} by user '${username}' has been deleted.`,
      reviews: book.reviews
    });
  } else {
    return res.status(404).json({ message: `No review by user '${username}' found for ISBN ${isbn}.` });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
