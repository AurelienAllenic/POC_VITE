const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = "users.json"; // Fichier où les utilisateurs seront stockés
const SECRET_KEY = "tonSecretDeJWT"; // Clé secrète pour signer les tokens JWT

// Fonction pour lire les utilisateurs depuis le fichier JSON
const readUsersFromFile = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return []; // Si le fichier n'existe pas ou est vide, on retourne un tableau vide
  }
};

// Fonction pour écrire les utilisateurs dans le fichier JSON
const writeUsersToFile = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
};

// Route pour connecter un utilisateur
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Nom d'utilisateur et mot de passe requis" });
  }

  const users = readUsersFromFile();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
  }

  // Création d'un token JWT
  const token = jwt.sign({ username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });

  return res.json({ token });
});

// Route pour enregistrer un nouvel utilisateur (pour la création d'utilisateurs)
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Nom d'utilisateur et mot de passe requis" });
  }

  const users = readUsersFromFile();
  const existingUser = users.find((u) => u.username === username);

  if (existingUser) {
    return res.status(400).json({ error: "Nom d'utilisateur déjà pris" });
  }

  // Ajouter l'utilisateur avec son mot de passe en clair
  users.push({ username, password });

  writeUsersToFile(users);

  return res.status(201).json({ message: "Utilisateur créé avec succès" });
});

// Démarrer le serveur
app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
