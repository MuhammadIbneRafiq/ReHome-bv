import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";

import { supabaseClient } from "./db/params.js";
import { sendEmail } from "./notif.js";
import { Role } from "./db/Role.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json()); // for parsing application/json
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1]; // Assuming "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Authentication token is required" });
  }

  try {
    const { data: user, error } = await supabaseClient.auth.getUser(token);

    if (error) {
      throw error;
    }

    req.user = user.user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token or user not found" });
  }
};

app.get("/", (req, res) => {
  res.send("ReHome B.V. running successfully... 🚀");
});

// User Role
app.post("/user/role", authenticateUser, async (req, res) => {
  const roles = new Role();
  const response = await roles.getRole(req.user.email);
  res.send(response?.role);
});

app.post("/user/setrole/:role", authenticateUser, async (req, res) => {
  const role = req.params.role;
  const roles = new Role();
  await roles.newRole(req.user.email, role);
  res.send("User Role successfully!");
});

// Auth
app.post("/auth/signup", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    const roles = new Role();
    await roles.newRole(email, role);

    if (data.session) {
      res.status(200).json({
        message: "User signed up successfully!",
        accessToken: data.session.access_token, // User will automatically logged in
      });
    }
  } catch (error) {
    console.error("Error in signup:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    res.json({ accessToken: data.session.access_token });
  } catch (error) {
    if (error.message) {
      return res.status(500).json({ error: error.message });
    }
  }
});

app.post("/auth/logout", authenticateUser, async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1]; // Assuming "Bearer TOKEN"

  try {
    const { error } = await supabaseClient.auth.signOut(token);

    if (error) {
      throw error;
    }

    res.send("User logged out successfully!");
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ error: error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
