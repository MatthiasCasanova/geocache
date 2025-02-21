document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm") as HTMLFormElement;
  if (!form) {
    console.error("Formulaire d'inscription introuvable");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("registerEmail") as HTMLInputElement;
    const passwordInput = document.getElementById("registerPassword") as HTMLInputElement;

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
      const response = await fetch("/utilisateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        console.log(`Inscription réussie pour ${email} !`);
        form.reset();
        window.location.href = "index.html";
      } else {
        console.error(`Erreur lors de l'inscription: ${data.message || "Données invalides"}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
    }
  });
});
