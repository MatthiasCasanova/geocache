// client/src/modal.ts
export function showModal(title, message) {
    const modalTitle = document.getElementById("messageModalLabel");
    const modalBody = document.getElementById("messageModalBody");
    if (modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.textContent = message;
        // @ts-ignore : jQuery doit être chargé via le CDN de Bootstrap
        $("#messageModal").modal("show");
    }
    else {
        console.log(title, message);
    }
}
