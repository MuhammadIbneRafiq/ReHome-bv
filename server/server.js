// server.js
import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from 'multer'; // Import multer for handling file uploads
import { v4 as uuidv4 } from 'uuid'; // Import uuid to generate unique file names
import { supabaseClient } from "./db/params.js"; // Import both clients
import { sendEmail } from "./notif.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json()); // for parsing application/json

// Set up Multer for file uploads (in-memory storage for simplicity)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// 5. Image Upload Endpoint
app.post('/api/upload', upload.array('photos', 10), async (req, res) => {
  try {
      if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: 'No files were uploaded.' });
      }

      const uploadedFiles = req.files;
      const imageUrls = [];
      console.log('uplod', uploadedFiles)
      // Check if the bucket exists (but don't try to create it here!)
      const { data: bucketData, error: bucketError } = await supabaseClient.storage.getBucket('furniture-images');
      console.log('thi sis buckt data', bucketData)

      for (const file of uploadedFiles) {
          // Generate a unique filename
          const fileExtension = file.originalname.split('.').pop();
          const fileName = `${uuidv4()}.${fileExtension}`;

          console.log('uploaded smth', fileExtension)
          console.log('sdikf', fileName)

          const fileObject = new File([file.buffer], fileName, { type: file.mimetype });
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('furniture-images')
            .upload(fileName, fileObject);

          if (uploadError) {
              console.error('Error uploading file:', uploadError);
              return res.status(500).json({ error: 'Failed to upload image.', details: uploadError });
          }
          const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/furniture-images/${fileName}`;
          console.log('this is img url', imageUrl)
          imageUrls.push(imageUrl);
      }

      res.status(200).json({ imageUrls }); // Return an array of image URLs
  } catch (error) {
      console.error('Error during upload:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. New Furniture Listing Endpoint
app.post('/api/furniture/new', authenticateUser, async (req, res) => {
    const { name, description, imageUrl, price } = req.body; // Changed image_url to imageUrl
    const sellerEmail = req.user.email; // Get seller's email from the authenticated user

    if (!name || !price || !imageUrl) { // Modified check
        return res.status(400).json({ error: 'Name, price, and image URL are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('furniture')
            .insert([{ name, description, image_url: imageUrl, price, seller_email: sellerEmail }])
            .select();
        console.log('this is NEW FUNR', data)
        if (error) {
            console.error('Error creating furniture:', error);
            return res.status(500).json(handleSupabaseError(error));
        }

        res.status(201).json(data[0]); // Return the newly created item
    } catch (err) {
        console.error('Error creating furniture:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});