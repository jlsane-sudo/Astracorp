import { supabase } from "../lib/supabase";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export async function signUp(email, password, username) {
  const cleanEmail = clean(email).toLowerCase();
  const cleanPassword = password ?? "";
  const cleanUsername = clean(username);

  if (!cleanUsername) {
    throw new Error("Introduce un nombre de usuario.");
  }

  if (!isValidUsername(cleanUsername)) {
    throw new Error(
      "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede usar letras, numeros o guion bajo."
    );
  }

  if (!cleanEmail) {
    throw new Error("Introduce un correo electronico.");
  }

  if (!isValidEmail(cleanEmail)) {
    throw new Error("El correo electronico no tiene un formato valido.");
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
    options: {
      data: {
        username: cleanUsername,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(email, password) {
  const cleanEmail = clean(email).toLowerCase();
  const cleanPassword = password ?? "";

  if (!cleanEmail) {
    throw new Error("Introduce tu correo electronico.");
  }

  if (!isValidEmail(cleanEmail)) {
    throw new Error("El correo electronico no tiene un formato valido.");
  }

  if (!cleanPassword) {
    throw new Error("Introduce tu contrasena.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user ?? null;
}

export async function getMyProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMyProfile(patch) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No hay usuario autenticado.");
  }

  const nextPatch = { ...patch };

  if (typeof nextPatch.username === "string") {
    nextPatch.username = nextPatch.username.trim();

    if (!isValidUsername(nextPatch.username)) {
      throw new Error(
        "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede usar letras, numeros o guion bajo."
      );
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(nextPatch)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
