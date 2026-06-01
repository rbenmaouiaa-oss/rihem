import { supabase } from "../supabase"

export async function createPointage(employeeId, nom = "Ben Maouia", prenom = "Rihem") {

  const status_qr = true
  const status_face = true
  const status = "valide"
  const currentHeure = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  })

  const { data, error } = await supabase
    .from("attendance_logs")
    .insert([
      {
        employee_id: String(employeeId),
        nom,
        prenom,
        status_qr,
        status_face,
        status,
        date: new Date().toISOString().split("T")[0],
        entree1: currentHeure
      }
    ])

  if (error) console.error("createPointage Error:", error.message)

  return data
}