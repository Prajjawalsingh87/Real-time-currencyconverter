import { useSyncExternalStore } from "react"

const subscribe = (onChange) => {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

// true while the browser reports a network connection.
export default function useOnlineStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}
