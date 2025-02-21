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
    console.log("Page de connexion chargée");
    const form = document.getElementById("loginForm");
    if (!form) {
        console.error("Formulaire de connexion introuvable");
        return;
    }
    form.addEventListener("submit", (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        // Vérifiez que les éléments existent
        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
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
            const response = yield fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = yield response.json();
            if (response.ok && data.success) {
                localStorage.setItem("token", data.token);
                console.log("Token: " + data.token);
                console.log(`Bienvenue ${data.email}`);
                window.location.href = "session.html";
            }
            else {
                console.error(data.message || "Erreur lors de la connexion");
            }
        }
        catch (error) {
            console.error("Erreur lors de la connexion:", error);
        }
    }));
});
