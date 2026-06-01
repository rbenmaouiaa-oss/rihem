import { createPointage } from "../services/pointageService"

async function handleValidation() {

  const qrOk = true
  const faceOk = true

  if (qrOk && faceOk) {

    await createPointage(employeId)

    alert("Pointage validé ✅")
  } else {
    alert("Échec ❌")
  }
}