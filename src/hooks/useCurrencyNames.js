import { useEffect, useState } from "react"
import { fetchApi } from "./UseCurrencyInfo"

// Full names for every currency code: { usd: "US Dollar", inr: "Indian Rupee", ... }
function useCurrencyNames() {
  const [names, setNames] = useState({})

  useEffect(() => {
    fetchApi("currencies.json")
      .then(setNames)
      .catch(() => setNames({}))
  }, [])

  return names
}

export default useCurrencyNames
