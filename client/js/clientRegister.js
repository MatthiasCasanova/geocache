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
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    if (!form) {
        console.error("Formulaire d'inscription introuvable");
        return;
    }
    form.addEventListener("submit", (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        const emailInput = document.getElementById("registerEmail");
        const passwordInput = document.getElementById("registerPassword");
        if (!emailInput || !passwordInput) {
            console.error("Erreur : Champs introuvables");
            return;
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) {
            console.error("Veuillez remplir tous les champs.");
            return;
        }
        try {
            const response = yield fetch("/utilisateur", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = yield response.json();
            if (response.ok && data.success) {
                console.log(`Inscription réussie pour ${email} !`);
                form.reset();
                window.location.href = "index.html";
            }
            else {
                console.error(`Erreur lors de l'inscription: ${data.message || "Données invalides"}`);
            }
        }
        catch (error) {
            console.error("Erreur lors de l'inscription:", error);
        }
    }));
});
