document.addEventListener("DOMContentLoaded", async () => {
  // Récupération du token depuis le localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }
  console.log("Token récupéré :", token);

  let currentEmail = "";
  try {
    const userResponse = await fetch("/currentUser", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Erreur /currentUser :", errorText);
      throw new Error("Impossible de récupérer l'utilisateur courant");
    }
    const userData = await userResponse.json();
    currentEmail = userData.user.email;
    const emailPrefix = currentEmail.split("@")[0];
    const usernameSpan = document.getElementById("username");
    if (usernameSpan) {
      usernameSpan.textContent = emailPrefix;
    }
    console.log("Utilisateur connecté :", currentEmail);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    localStorage.removeItem("token");
    window.location.href = "index.html";
    return;
  }

  // Initialisation de la carte Leaflet
  const map = L.map("map").setView([48.8566, 2.3522], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Stockage des marqueurs pour recharger sans réinitialiser la carte
  let markers: L.Marker[] = [];

  async function loadGeocaches() {
    try {
      const response = await fetch("/geocache");
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const geocaches = await response.json();
      console.log("Géocaches récupérées :", geocaches);

      // Retirer les anciens marqueurs
      markers.forEach(marker => map.removeLayer(marker));
      markers = [];

      geocaches.forEach((cache: any) => {
        if (cache.gps && typeof cache.gps.lat === "number" && typeof cache.gps.lng === "number") {
          // menage : virer les acchettes sans mail et virer l'ancienne partie de code liées
          const createdByDisplay = cache.createdBy ? cache.createdBy.split("@")[0] : "Inconnu";
          let popupContent = `
            <div class="card" style="width: 18rem;">
              <div class="card-body">
                <h5 class="card-title">${cache.nomCache}</h5>
                <h6 class="card-subtitle mb-2 text-muted">Difficulté : ${cache.difficulty}</h6>
                <p class="card-text">Créé par : ${createdByDisplay}</p>
                <div class="btn-group mb-2" role="group">
          `;
          if (cache.createdBy === currentEmail) {
            popupContent += `
                  <button class="btn btn-warning btn-sm edit-cache"
                    data-id="${cache._id}"
                    data-nomcache="${cache.nomCache}"
                    data-lat="${cache.gps.lat}"
                    data-lng="${cache.gps.lng}"
                    data-difficulty="${cache.difficulty}"
                    data-description="${cache.description || ""}">
                    Modifier
                  </button>
                  <button class="btn btn-danger btn-sm delete-cache" data-id="${cache._id}">
                    Supprimer
                  </button>
            `;
          }
          popupContent += `
                  <button class="btn btn-info btn-sm comment-cache" data-id="${cache._id}">
                    Commenter
                  </button>
                </div>
              </div>
          `;
          if (cache.comments && cache.comments.length > 0) {
            popupContent += `<ul class="list-group list-group-flush">`;
            cache.comments.forEach((comment: any) => {
              const commentUserDisplay = comment.user ? comment.user.split("@")[0] : "Inconnu";
              popupContent += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>${commentUserDisplay}</strong> : ${comment.text}
                  </div>
                  <div>
                    <span class="badge badge-primary badge-pill mr-2">${comment.likes}</span>
                    <button class="btn btn-outline-primary btn-sm like-comment"
                      data-geocacheid="${cache._id}" data-commentid="${comment._id}">
                      Like
                    </button>
                  </div>
                </li>
              `;
            });
            popupContent += `</ul>`;
          }
          popupContent += `</div>`; // fermeture de la card

          const marker = L.marker([cache.gps.lat, cache.gps.lng]).addTo(map);
          marker.bindPopup(popupContent);
          markers.push(marker);
        }
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des géocaches :", error);
    }
  }

  // Charger initialement les géocaches
  await loadGeocaches();

  // Bouton de déconnexion
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }

  // Suppression d'une géocache
  document.addEventListener("click", async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains("delete-cache")) {
      const geocacheId = target.getAttribute("data-id");
      if (geocacheId && confirm("Voulez-vous vraiment supprimer cette géocache ?")) {
        try {
          const delResponse = await fetch(`/geocache/${geocacheId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          const delData = await delResponse.json();
          if (delResponse.ok) {
            console.log("Géocache supprimée");
            await loadGeocaches();
          } else {
            console.error("Erreur lors de la suppression :", delData.message);
          }
        } catch (error) {
          console.error("Erreur lors de la suppression de la géocache :", error);
        }
      }
    }
  });

  // Ouverture du modal pour modifier une géocache
  document.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains("edit-cache")) {
      const id = target.getAttribute("data-id")!;
      const nomCache = target.getAttribute("data-nomcache")!;
      const lat = target.getAttribute("data-lat")!;
      const lng = target.getAttribute("data-lng")!;
      const difficulty = target.getAttribute("data-difficulty")!;
      const description = target.getAttribute("data-description")!;

      const editCacheIdEl = document.getElementById("editCacheId") as HTMLInputElement | null;
      const editNomCacheEl = document.getElementById("editNomCache") as HTMLInputElement | null;
      const editLatEl = document.getElementById("editLat") as HTMLInputElement | null;
      const editLngEl = document.getElementById("editLng") as HTMLInputElement | null;
      const editDifficultyEl = document.getElementById("editDifficulty") as HTMLInputElement | null;
      const editDescriptionEl = document.getElementById("editDescription") as HTMLTextAreaElement | null;

      if (!editCacheIdEl || !editNomCacheEl || !editLatEl || !editLngEl || !editDifficultyEl || !editDescriptionEl) {
        console.error("Erreur : Certains éléments du modal d'édition sont introuvables.");
        return;
      }

      editCacheIdEl.value = id;
      editNomCacheEl.value = nomCache;
      editLatEl.value = lat;
      editLngEl.value = lng;
      editDifficultyEl.value = difficulty;
      editDescriptionEl.value = description;

      // Ouvrir le modal via jQuery/Bootstrap
      // @ts-ignore
      $('#editCacheModal').modal('show');
    }
  });

  // Soumission du formulaire de modification
  const editForm = document.getElementById("editCacheForm") as HTMLFormElement | null;
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = (document.getElementById("editCacheId") as HTMLInputElement).value;
      const nomCache = (document.getElementById("editNomCache") as HTMLInputElement).value.trim();
      const lat = parseFloat((document.getElementById("editLat") as HTMLInputElement).value);
      const lng = parseFloat((document.getElementById("editLng") as HTMLInputElement).value);
      const difficulty = parseInt((document.getElementById("editDifficulty") as HTMLInputElement).value, 10);
      const description = (document.getElementById("editDescription") as HTMLTextAreaElement).value.trim();

      if (!nomCache || isNaN(lat) || isNaN(lng) || isNaN(difficulty)) {
        console.error("Veuillez remplir tous les champs correctement.");
        return;
      }

      try {
        const response = await fetch(`/geocache/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ nomCache, gps: { lat, lng }, difficulty, description })
        });
        const data = await response.json();
        if (response.ok) {
          console.log("Géocache modifiée avec succès !");
          // Fermer le modal et mettre à jour uniquement les marqueurs
          // @ts-ignore
          $('#editCacheModal').modal('hide');
          await loadGeocaches();
        } else {
          console.error("Erreur lors de la modification :", data.message);
        }
      } catch (error) {
        console.error("Erreur lors de la modification de la géocache :", error);
      }
    });
  }

  // Ouverture du modal pour ajouter un commentaire
  document.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains("comment-cache")) {
      const geocacheId = target.getAttribute("data-id");
      if (geocacheId) {
        const commentGeocacheIdEl = document.getElementById("commentGeocacheId") as HTMLInputElement | null;
        if (commentGeocacheIdEl) {
          commentGeocacheIdEl.value = geocacheId;
          // Ouvrir le modal via jQuery/Bootstrap
          // @ts-ignore
          $('#commentModal').modal('show');
        } else {
          console.error("Élément commentGeocacheId introuvable.");
        }
      }
    }
  });

  // Soumission du formulaire de commentaire
  const commentForm = document.getElementById("commentForm") as HTMLFormElement | null;
  if (commentForm) {
    commentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const geocacheId = (document.getElementById("commentGeocacheId") as HTMLInputElement).value;
      const commentText = (document.getElementById("commentText") as HTMLTextAreaElement).value.trim();
      if (!commentText) {
        console.error("Le commentaire ne peut pas être vide.");
        return;
      }
      try {
        const response = await fetch(`/geocache/${geocacheId}/comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ text: commentText })
        });
        const data = await response.json();
        if (response.ok) {
          console.log("Commentaire ajouté avec succès !");
          // Fermer le modal et recharger uniquement les marqueurs
          // @ts-ignore
          $('#commentModal').modal('hide');
          await loadGeocaches();
        } else {
          console.error("Erreur lors de l'ajout du commentaire :", data.message);
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error);
      }
    });
  }

  // Gestion du like sur un commentaire (mise à jour du badge sans recharger la carte)
  document.addEventListener("click", async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains("like-comment")) {
      const geocacheId = target.getAttribute("data-geocacheid");
      const commentId = target.getAttribute("data-commentid");
      if (geocacheId && commentId) {
        try {
          const response = await fetch(`/geocache/${geocacheId}/comment/${commentId}/like`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok) {
            console.log("Commentaire liké !");
            // Mise à jour du badge dans le DOM sans recharger la carte
            const li = target.closest("li");
            if (li) {
              const badge = li.querySelector(".badge");
              if (badge) {
                let currentLikes = parseInt(badge.textContent || "0", 10);
                badge.textContent = (currentLikes + 1).toString();
              }
              // Désactiver le bouton de like pour ce commentaire
              target.setAttribute("disabled", "true");
            }
          } else {
            console.error("Erreur lors du like :", data.message);
          }
        } catch (error) {
          console.error("Erreur lors du like du commentaire :", error);
        }
      }
    }
  });
});
