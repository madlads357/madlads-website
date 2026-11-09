// Linking X or Discord needs the database, and is for the wallet login only: with Matrica, the X handle
// and the Discord roles come from Matrica, and a linked account would overwrite them (server-only).
import { authMode } from "@/lib/auth/config";
import { db } from "@/lib/db";

export const accountsAvailable = () => !!db && authMode() !== "matrica";
