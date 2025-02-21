document.addEventListener("DOMContentLoaded", () => {
  console.log("Page de connexion chargée");
  const form = document.getElementById("loginForm") as HTMLFormElement | null;
  if (!form) {
    console.error("Formulaire de connexion introuvable");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Vérifiez que les éléments existent
    const emailInput = document.getElementById("loginEmail") as HTMLInputElement | null;
    const passwordInput = document.getElementById("loginPassword") as HTMLInputElement | null;

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
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        console.log("Token: " + data.token);
        console.log(`Bienvenue ${data.email}`);
        window.location.href = "session.html";
      } else {
        console.error(data.message || "Erreur lors de la connexion");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
    }
  });
});
