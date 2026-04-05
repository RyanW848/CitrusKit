import { useEffect, useState } from "react";
import client from "../api/citrusClient";

function getOwnerLetter(slot) {
  if (typeof slot !== "number" || slot < 1) {
    return "?";
  }

  if (slot <= 26) {
    return String.fromCharCode(64 + slot);
  }

  return String(slot);
}

export function formatLeagueOwners(league) {
  return (league?.owners || []).map((owner, index) => ({
    ...owner,
    letter: getOwnerLetter(owner.slot ?? index + 1),
  }));
}

export default function useLeague(leagueId) {
  const [league, setLeague] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leagueId) {
      setLeague(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    client.get(`/leagues/${leagueId}`)
      .then(({ data }) => {
        if (isMounted) {
          setLeague(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLeague(null);
          setError(err.response?.data?.error || "Unable to load league");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [leagueId]);

  return { league, isLoading, error };
}
