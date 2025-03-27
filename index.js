const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const LOCATION_FILE = "locations.json"; // Fichier où les localisations seront stockées
const USERS_FILE = "users.json"; // Fichier où les utilisateurs seront stockés
const SECRET_KEY = "tonSecretDeJWT"; // Clé secrète pour signer les tokens JWT

// Fonction pour lire les données depuis le fichier JSON
const readLocationsFromFile = () => {
  try {
    const data = fs.readFileSync(LOCATION_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return []; // Si le fichier n'existe pas ou est vide, on retourne un tableau vide
  }
};

// Fonction pour écrire les données dans le fichier JSON
const writeLocationsToFile = (locations) => {
  fs.writeFileSync(LOCATION_FILE, JSON.stringify(locations, null, 2), "utf8");
};

// Fonction pour lire les utilisateurs depuis le fichier JSON
const readUsersFromFile = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return []; // Si le fichier n'existe pas ou est vide, on retourne un tableau vide
  }
};

// Middleware d'authentification pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ error: "Accès non autorisé, token manquant" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Accès interdit, token invalide" });
    }
    req.user = user; // Ajouter l'utilisateur au requête pour l'utiliser dans les routes suivantes
    next();
  });
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

// Route pour enregistrer une localisation
app.post("/api/location", authenticateToken, (req, res) => {
  const { latitude, longitude } = req.body;
  const user = req.user.username; // Utilisation de l'utilisateur extrait du token

  if (!latitude || !longitude || !user) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  // Lire les localisations existantes depuis le fichier
  let locations = readLocationsFromFile();

  // Vérifier si l'utilisateur existe déjà dans les données
  const existingUserIndex = locations.findIndex(
    (location) => location.user === user
  );

  if (existingUserIndex !== -1) {
    // Si l'utilisateur existe, on écrase la localisation précédente
    locations[existingUserIndex] = {
      user,
      latitude,
      longitude,
      timestamp: new Date(),
    };
  } else {
    // Si l'utilisateur n'existe pas, on ajoute une nouvelle localisation
    locations.push({ user, latitude, longitude, timestamp: new Date() });
  }

  // Sauvegarder les données mises à jour dans le fichier
  writeLocationsToFile(locations);

  return res
    .status(200)
    .json({ message: "Localisation ajoutée ou mise à jour" });
});

// Route pour récupérer toutes les localisations
app.get("/api/location", (req, res) => {
  const locations = readLocationsFromFile(); // Lire les données depuis le fichier
  return res.json(locations);
});

// Démarrer le serveur
app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
