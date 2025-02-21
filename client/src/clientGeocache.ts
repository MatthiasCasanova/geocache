document.addEventListener("DOMContentLoaded", async () => {
  // Récupération du token depuis le localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const form = document.getElementById("geocacheForm") as HTMLFormElement;
  if (!form) {
    console.error("Formulaire de géocache introuvable.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nomCache = (document.getElementById("nomCache") as HTMLInputElement).value.trim();
    const lat = parseFloat((document.getElementById("lat") as HTMLInputElement).value);
    const lng = parseFloat((document.getElementById("lng") as HTMLInputElement).value);
    const difficulty = parseInt((document.getElementById("difficulty") as HTMLInputElement).value, 10);
    const description = (document.getElementById("description") as HTMLTextAreaElement).value.trim();

    if (!nomCache || isNaN(lat) || isNaN(lng) || isNaN(difficulty)) {
      console.error("Veuillez remplir tous les champs correctement.");
      return;
    }

    try {
      const response = await fetch("/geocache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nomCache, gps: { lat, lng }, difficulty, description })
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Géocache créée avec succès !");
        window.location.href = "session.html";
      } else {
        console.error("Erreur lors de la création de la géocache :", data.message);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la géocache :", error);
    }
  });
});
