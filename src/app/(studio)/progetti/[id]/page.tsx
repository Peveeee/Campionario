"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Progetto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => router.replace(`/progetti/${id}/schedario`), [id, router]);
  return null;
}
