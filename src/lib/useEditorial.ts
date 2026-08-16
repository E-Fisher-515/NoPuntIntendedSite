"use client";

import { useEffect, useState } from "react";
import { emptyEditorial, fetchEditorial } from "./editorial";
import type { Editorial } from "./types";

export function useEditorial(initial?: Editorial) {
  const [editorial, setEditorial] = useState<Editorial>(initial ?? emptyEditorial());

  useEffect(() => {
    let cancelled = false;
    fetchEditorial().then((data) => {
      if (!cancelled) setEditorial(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return editorial;
}
