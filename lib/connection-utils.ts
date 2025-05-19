export function clearConnections(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("movieGameConnections")
}
