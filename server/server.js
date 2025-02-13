// server.js (or your main server file)
import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";

import { supabaseClient } from "./db/params.js";
import { sendEmail } from "./notif.js";

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

// Auth
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

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


const supabase = supabaseClient

// Helper function to handle Supabase errors
const handleSupabaseError = (error) => {
    console.error('Supabase error:', error);
    return { error: 'Internal Server Error' };
};

// -------------------- Express Routes --------------------

// 1. Get all furniture items
app.get('/api/furniture', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('furniture')
            .select('*')
            .order('created_at', { ascending: false }); // Order by creation date, newest first

        if (error) {
            return res.status(500).json(handleSupabaseError(error));
        }

        res.json(data);
    } catch (err) {
        console.error('Error fetching furniture:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Add a new furniture item
app.post('/api/furniture', async (req, res) => {
    const { name, description, image_url, price } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required fields.' });
    }

    try {
        const { data, error } = await supabase
            .from('furniture')
            .insert([{ name, description, image_url, price }])
            .select(); // Return the inserted data

        if (error) {
            return res.status(500).json(handleSupabaseError(error));
        }

        res.status(201).json(data[0]); // Return the newly created item
    } catch (err) {
        console.error('Error adding furniture:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. Update a furniture item
app.put('/api/furniture/:id', async (req, res) => {
    const furnitureId = req.params.id;
    const { name, description, image_url, price } = req.body;

    if (!furnitureId) {
        return res.status(400).json({ error: 'Furniture ID is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('furniture')
            .update({ name, description, image_url, price })
            .eq('id', furnitureId)
            .select();

        if (error) {
            return res.status(500).json(handleSupabaseError(error));
        }

        if (data && data.length > 0) {
            res.json(data[0]); // Return the updated item
        } else {
            res.status(404).json({ error: 'Furniture item not found.' });
        }
    } catch (err) {
        console.error('Error updating furniture:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. Delete a furniture item
app.delete('/api/furniture/:id', async (req, res) => {
    const furnitureId = req.params.id;

    if (!furnitureId) {
        return res.status(400).json({ error: 'Furniture ID is required.' });
    }

    try {
        const { error } = await supabase
            .from('furniture')
            .delete()
            .eq('id', furnitureId);

        if (error) {
            return res.status(500).json(handleSupabaseError(error));
        }

        res.status(204).send(); // No content on successful delete
    } catch (err) {
        console.error('Error deleting furniture:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});