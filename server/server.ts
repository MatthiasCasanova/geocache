import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { MongoClient, Db, Collection, InsertOneResult, ObjectId, DeleteResult } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Extension de l'interface Request pour ajouter "user"
declare module "express-serve-static-core" {
  interface Request {
    user?: { email: string };
  }
}

const app = express();
const port: number = Number(process.env.PORT) || 3000;
const mongoUrl: string = process.env.MONGO_URL || "mongodb+srv://matthiascasanova0311:P44SpaL4GKj1ba3K@cluster0.qxej1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName: string = "maBase";
const JWT_SECRET = "maSuperCleSecrete"; // À stocker dans un .env en production

// Le dossier public se trouve dans ../../client (car ce fichier est dans server/src)
const publicPath = path.join(__dirname, "../../client");

app.use(express.json());
app.use(express.static(publicPath));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

MongoClient.connect(mongoUrl)
  .then(client => {
    console.log("✅ Connecté à MongoDB");
    const db: Db = client.db(dbName);
    const utilisateurCollection: Collection = db.collection("utilisateur");
    const geocacheCollection: Collection = db.collection("geocache");

    // Middleware d'authentification JWT pour les routes protégées
    function authenticateToken(req: Request, res: Response, next: NextFunction) {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({ success: false, message: "Accès refusé : token manquant" });
      }
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ success: false, message: "Accès refusé : token invalide" });
        }
        req.user = user as { email: string };
        next();
      });
    }

    // GET /currentUser - Renvoie l'utilisateur connecté (via son email)
    app.get("/currentUser", authenticateToken, async (req: Request, res: Response) => {
      try {
        const email = req.user!.email;
        const user = await utilisateurCollection.findOne({ email });
        if (!user) {
          return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }
        res.json({ success: true, user });
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur courant :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // POST /utilisateur - Inscription par e-mail
    app.post("/utilisateur", async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ success: false, message: "Champs email et password requis." });
        }
        const existingUser = await utilisateurCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ success: false, message: "Utilisateur déjà existant" });
        }
        // En production, hachez le mot de passe avec bcrypt
        const hashedPassword = password; // Remplacer par bcrypt.hash(password, saltRounds)
        const result: InsertOneResult = await utilisateurCollection.insertOne({ email, password: hashedPassword });
        res.json({ success: true, message: "Utilisateur créé avec succès", userId: result.insertedId });
      } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // GET /utilisateur - Liste complète des utilisateurs (publique)
    app.get("/utilisateur", async (req: Request, res: Response) => {
      try {
        const users = await utilisateurCollection.find({}).toArray();
        res.json(users);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // POST /login - Connexion par e-mail
    app.post("/login", async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ success: false, message: "Champs email et password requis." });
        }
        const user = await utilisateurCollection.findOne({ email });
        if (!user) {
          return res.status(400).json({ success: false, message: "Utilisateur non trouvé" });
        }
        if (password !== user.password) {
          return res.status(400).json({ success: false, message: "Mot de passe incorrect" });
        }
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ email: user.email, success: true, token });
      } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // DELETE /utilisateur/:id - Suppression d'un utilisateur (protégé)
    app.delete("/utilisateur/:id", authenticateToken, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const deleteResult: DeleteResult = await utilisateurCollection.deleteOne({ _id: new ObjectId(id) });
        if (deleteResult.deletedCount === 0) {
          return res.status(400).json({ success: false, message: "Utilisateur non trouvé ou déjà supprimé" });
        }
        res.json({ success: true, message: "Utilisateur supprimé avec succès" });
      } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // POST /geocache - Création d'une géocache (protégé)
    app.post("/geocache", authenticateToken, async (req: Request, res: Response) => {
      try {
        const { nomCache, gps, difficulty, description } = req.body;
        if (!nomCache || !gps || typeof gps.lat !== "number" || typeof gps.lng !== "number" || !difficulty) {
          return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
        }
        const createdBy = req.user!.email;
        const result: InsertOneResult = await geocacheCollection.insertOne({
          nomCache,
          gps,
          difficulty,
          description: description || "",
          createdBy,
          comments: []  // Initialisation du tableau de commentaires
        });
        res.json({ success: true, message: "Géocache créée", geocacheId: result.insertedId });
      } catch (error) {
        console.error("Erreur lors de la création de la géocache :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // GET /geocache - Liste complète des géocaches (publique)
    app.get("/geocache", async (req: Request, res: Response) => {
      try {
        const geocaches = await geocacheCollection.find({}).toArray();
        res.json(geocaches);
      } catch (error) {
        console.error("Erreur lors de la récupération des géocaches :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // PUT /geocache/:id - Modification d'une géocache (protégé, uniquement par le créateur)
    app.put("/geocache/:id", authenticateToken, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { nomCache, gps, difficulty, description } = req.body;
        if (!nomCache || !gps || typeof gps.lat !== "number" || typeof gps.lng !== "number" || !difficulty) {
          return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });
        }
        const cache = await geocacheCollection.findOne({ _id: new ObjectId(id) });
        if (!cache) {
          return res.status(404).json({ success: false, message: "Géocache non trouvée" });
        }
        if (cache.createdBy !== req.user!.email) {
          return res.status(403).json({ success: false, message: "Vous ne pouvez pas modifier cette géocache." });
        }
        const updateResult = await geocacheCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { nomCache, gps, difficulty, description: description || "" } }
        );
        if (updateResult.modifiedCount === 0) {
          return res.status(400).json({ success: false, message: "Aucune modification effectuée." });
        }
        res.json({ success: true, message: "Géocache modifiée" });
      } catch (error) {
        console.error("Erreur lors de la modification de la géocache :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // DELETE /geocache/:id - Suppression d'une géocache (protégé, uniquement par le créateur)
    app.delete("/geocache/:id", authenticateToken, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const cache = await geocacheCollection.findOne({ _id: new ObjectId(id) });
        if (!cache) {
          return res.status(404).json({ success: false, message: "Géocache non trouvée" });
        }
        if (cache.createdBy !== req.user!.email) {
          return res.status(403).json({ success: false, message: "Vous ne pouvez pas supprimer cette géocache." });
        }
        await geocacheCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true, message: "Géocache supprimée" });
      } catch (error) {
        console.error("Erreur lors de la suppression de la géocache :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // POST /geocache/:id/comment - Ajout d'un commentaire sur une géocache (protégé)
    app.post("/geocache/:id/comment", authenticateToken, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { text } = req.body;
        if (!text) {
          return res.status(400).json({ success: false, message: "Le texte du commentaire est requis." });
        }
        const comment = {
          _id: new ObjectId(),
          user: req.user!.email,
          text,
          likes: 0,
          likedBy: []  // Tableau pour enregistrer les utilisateurs ayant liké ce commentaire
        };
        const updateResult = await geocacheCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { comments: comment } } as any
        );
        if (updateResult.modifiedCount === 0) {
          return res.status(400).json({ success: false, message: "Impossible d'ajouter le commentaire." });
        }
        res.json({ success: true, message: "Commentaire ajouté", comment });
      } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    // PUT /geocache/:geocacheId/comment/:commentId/like - Liker un commentaire (protégé, une seule fois par utilisateur pour chaque commentaire)
    app.put("/geocache/:geocacheId/comment/:commentId/like", authenticateToken, async (req: Request, res: Response) => {
      try {
        const { geocacheId, commentId } = req.params;
        const userEmail = req.user!.email;
        // Utilisation d'arrayFilters pour cibler uniquement le commentaire visé
        const updateResult = await geocacheCollection.updateOne(
          { _id: new ObjectId(geocacheId) },
          {
            $inc: { "comments.$[elem].likes": 1 },
            $push: { "comments.$[elem].likedBy": userEmail }
          } as any,
          {
            arrayFilters: [{ "elem._id": new ObjectId(commentId), "elem.likedBy": { $ne: userEmail } }]
          }
        );
        if (updateResult.modifiedCount === 0) {
          return res.status(400).json({ success: false, message: "Vous avez déjà liké ce commentaire ou le commentaire est introuvable." });
        }
        // Récupération du nouveau nombre de likes pour le commentaire
        const updatedCache = await geocacheCollection.findOne({ _id: new ObjectId(geocacheId) });
        const updatedComment = updatedCache?.comments.find((c: any) => c._id.toString() === commentId);
        res.json({ success: true, message: "Commentaire liké", likes: updatedComment?.likes });
      } catch (error) {
        console.error("Erreur lors du like du commentaire :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
      }
    });

    app.listen(port, () => {
      console.log(`🚀 Serveur en écoute sur http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error("Erreur de connexion à MongoDB :", error);
  });
