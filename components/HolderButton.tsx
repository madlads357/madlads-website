"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { readHint } from "@/lib/auth/hint";
import { links } from "@/data/site";

// The homepage Holders button: "Login with Backpack", or "Open your holder area" for a holder already
// logged in (from the readable hint cookie, like the header; the page itself stays static).
export function HolderButton() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => setLoggedIn(readHint(document.cookie) !== null), []);
  return loggedIn ? <Button href="/holders">Open your holder area</Button> : <Button href={links.login}>Login with Backpack</Button>;
}
