import { useCallback, useEffect, useState } from "react";
import { fetchMyLeagues } from "../api/leaguesApi";

export function useMyLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyLeagues();
      setLeagues(data);
    } catch (err) {
      setLeagues([]);
      setError(err.response?.data?.error || "Could not load leagues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { leagues, loading, error, reload, setLeagues };
}
