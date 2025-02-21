"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const mongodb_1 = require("mongodb");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
const port: number = Number(process.env.PORT) || 3000;
const mongoUrl: string = process.env.MONGO_URL || "mongodb+srv://matthiascasanova0311:P44SpaL4GKj1ba3K@cluster0.qxej1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "maBase";
const JWT_SECRET = process.env.JWT_SECRET || "maSuperCleSecrete";
// Le dossier public se trouve dans ../../client (car ce fichier est dans server/src)
const publicPath = path_1.default.join(__dirname, "../../client");
app.use(express_1.default.json());
app.use(express_1.default.static(publicPath));
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(publicPath, "index.html"));
});
mongodb_1.MongoClient.connect(mongoUrl)
    .then(client => {
    console.log("✅ Connecté à MongoDB");
    const db = client.db(dbName);
    const utilisateurCollection = db.collection("utilisateur");
    const geocacheCollection = db.collection("geocache");
    // Middleware d'authentification JWT pour les routes protégées
    function authenticateToken(req, res, next) {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Accès refusé : token manquant" });
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ success: false, message: "Accès refusé : token invalide" });
            }
            req.user = user;
            next();
        });
    }
    // GET /currentUser - Renvoie l'utilisateur connecté (via son email)
    app.get("/currentUser", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const email = req.user.email;
            const user = yield utilisateurCollection.findOne({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }
            res.json({ success: true, user });
        }
        catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur courant :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // POST /utilisateur - Inscription par e-mail
    app.post("/utilisateur", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Champs email et password requis." });
            }
            const existingUser = yield utilisateurCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Utilisateur déjà existant" });
            }
            // En production, hachez le mot de passe avec bcrypt
            const hashedPassword = password; // Remplacer par bcrypt.hash(password, saltRounds)
            const result = yield utilisateurCollection.insertOne({ email, password: hashedPassword });
            res.json({ success: true, message: "Utilisateur créé avec succès", userId: result.insertedId });
        }
        catch (error) {
            console.error("Erreur lors de l'inscription :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // GET /utilisateur - Liste complète des utilisateurs (publique)
    app.get("/utilisateur", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const users = yield utilisateurCollection.find({}).toArray();
            res.json(users);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des utilisateurs :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // POST /login - Connexion par e-mail
    app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Champs email et password requis." });
            }
            const user = yield utilisateurCollection.findOne({ email });
            if (!user) {
                return res.status(400).json({ success: false, message: "Utilisateur non trouvé" });
            }
            if (password !== user.password) {
                return res.status(400).json({ success: false, message: "Mot de passe incorrect" });
            }
            const token = jsonwebtoken_1.default.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });
            res.json({ email: user.email, success: true, token });
        }
        catch (error) {
            console.error("Erreur lors de la connexion :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // DELETE /utilisateur/:id - Suppression d'un utilisateur (protégé)
    app.delete("/utilisateur/:id", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const deleteResult = yield utilisateurCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
            if (deleteResult.deletedCount === 0) {
                return res.status(400).json({ success: false, message: "Utilisateur non trouvé ou déjà supprimé" });
            }
            res.json({ success: true, message: "Utilisateur supprimé avec succès" });
        }
        catch (error) {
            console.error("Erreur lors de la suppression de l'utilisateur :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // POST /geocache - Création d'une géocache (protégé)
    app.post("/geocache", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { nomCache, gps, difficulty, description } = req.body;
            if (!nomCache || !gps || typeof gps.lat !== "number" || typeof gps.lng !== "number" || !difficulty) {
                return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
            }
            const createdBy = req.user.email;
            const result = yield geocacheCollection.insertOne({
                nomCache,
                gps,
                difficulty,
                description: description || "",
                createdBy,
                comments: [] // Initialisation du tableau de commentaires
            });
            res.json({ success: true, message: "Géocache créée", geocacheId: result.insertedId });
        }
        catch (error) {
            console.error("Erreur lors de la création de la géocache :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // GET /geocache - Liste complète des géocaches (publique)
    app.get("/geocache", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const geocaches = yield geocacheCollection.find({}).toArray();
            res.json(geocaches);
        }
        catch (error) {
            console.error("Erreur lors de la récupération des géocaches :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // PUT /geocache/:id - Modification d'une géocache (protégé, uniquement par le créateur)
    app.put("/geocache/:id", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { nomCache, gps, difficulty, description } = req.body;
            if (!nomCache || !gps || typeof gps.lat !== "number" || typeof gps.lng !== "number" || !difficulty) {
                return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
            }
            const cache = yield geocacheCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
            if (!cache) {
                return res.status(404).json({ success: false, message: "Géocache non trouvée" });
            }
            if (cache.createdBy !== req.user.email) {
                return res.status(403).json({ success: false, message: "Vous ne pouvez pas modifier cette géocache." });
            }
            const updateResult = yield geocacheCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { nomCache, gps, difficulty, description: description || "" } });
            if (updateResult.modifiedCount === 0) {
                return res.status(400).json({ success: false, message: "Aucune modification effectuée." });
            }
            res.json({ success: true, message: "Géocache modifiée" });
        }
        catch (error) {
            console.error("Erreur lors de la modification de la géocache :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // DELETE /geocache/:id - Suppression d'une géocache (protégé, uniquement par le créateur)
    app.delete("/geocache/:id", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const cache = yield geocacheCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
            if (!cache) {
                return res.status(404).json({ success: false, message: "Géocache non trouvée" });
            }
            if (cache.createdBy !== req.user.email) {
                return res.status(403).json({ success: false, message: "Vous ne pouvez pas supprimer cette géocache." });
            }
            yield geocacheCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
            res.json({ success: true, message: "Géocache supprimée" });
        }
        catch (error) {
            console.error("Erreur lors de la suppression de la géocache :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // POST /geocache/:id/comment - Ajout d'un commentaire sur une géocache (protégé)
    app.post("/geocache/:id/comment", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ success: false, message: "Le texte du commentaire est requis." });
            }
            const comment = {
                _id: new mongodb_1.ObjectId(),
                user: req.user.email,
                text,
                likes: 0,
                likedBy: [] // Tableau pour enregistrer les utilisateurs ayant liké ce commentaire
            };
            const updateResult = yield geocacheCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $push: { comments: comment } });
            if (updateResult.modifiedCount === 0) {
                return res.status(400).json({ success: false, message: "Impossible d'ajouter le commentaire." });
            }
            res.json({ success: true, message: "Commentaire ajouté", comment });
        }
        catch (error) {
            console.error("Erreur lors de l'ajout du commentaire :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    // PUT /geocache/:geocacheId/comment/:commentId/like - Liker un commentaire (protégé, une seule fois par utilisateur pour chaque commentaire)
    app.put("/geocache/:geocacheId/comment/:commentId/like", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { geocacheId, commentId } = req.params;
            const userEmail = req.user.email;
            // Utilisation d'arrayFilters pour cibler uniquement le commentaire visé
            const updateResult = yield geocacheCollection.updateOne({ _id: new mongodb_1.ObjectId(geocacheId) }, {
                $inc: { "comments.$[elem].likes": 1 },
                $push: { "comments.$[elem].likedBy": userEmail }
            }, {
                arrayFilters: [{ "elem._id": new mongodb_1.ObjectId(commentId), "elem.likedBy": { $ne: userEmail } }]
            });
            if (updateResult.modifiedCount === 0) {
                return res.status(400).json({ success: false, message: "Vous avez déjà liké ce commentaire ou le commentaire est introuvable." });
            }
            // Récupération du nouveau nombre de likes pour le commentaire
            const updatedCache = yield geocacheCollection.findOne({ _id: new mongodb_1.ObjectId(geocacheId) });
            const updatedComment = updatedCache === null || updatedCache === void 0 ? void 0 : updatedCache.comments.find((c) => c._id.toString() === commentId);
            res.json({ success: true, message: "Commentaire liké", likes: updatedComment === null || updatedComment === void 0 ? void 0 : updatedComment.likes });
        }
        catch (error) {
            console.error("Erreur lors du like du commentaire :", error);
            res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }));
    app.listen(port, () => {
        console.log(`🚀 Serveur en écoute sur http://localhost:${port}`);
    });
})
    .catch(error => {
    console.error("Erreur de connexion à MongoDB :", error);
});
