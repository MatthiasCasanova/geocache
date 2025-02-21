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
document.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    // Récupération du token depuis le localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    const form = document.getElementById("geocacheForm");
    if (!form) {
        console.error("Formulaire de géocache introuvable.");
        return;
    }
    form.addEventListener("submit", (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        const nomCache = document.getElementById("nomCache").value.trim();
        const lat = parseFloat(document.getElementById("lat").value);
        const lng = parseFloat(document.getElementById("lng").value);
        const difficulty = parseInt(document.getElementById("difficulty").value, 10);
        const description = document.getElementById("description").value.trim();
        if (!nomCache || isNaN(lat) || isNaN(lng) || isNaN(difficulty)) {
            console.error("Veuillez remplir tous les champs correctement.");
            return;
        }
        try {
            const response = yield fetch("/geocache", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ nomCache, gps: { lat, lng }, difficulty, description })
            });
            const data = yield response.json();
            if (response.ok) {
                console.log("Géocache créée avec succès !");
                window.location.href = "session.html";
            }
            else {
                console.error("Erreur lors de la création de la géocache :", data.message);
            }
        }
        catch (error) {
            console.error("Erreur lors de la création de la géocache :", error);
        }
    }));
}));
