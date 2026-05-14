// services/auth/src/controllers/authController.js

const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const cfg = require("../config/env");

// helper to create a JWT
const signToken = (user) =>
  jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    cfg.jwtSecret,
    { expiresIn: "2h" },
  );

/* ---------- Joi schema ---------- */
const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/* ---------- Controllers ---------- */
async function register(req, res) {
  // validate input
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    return res.status(201).json({ token: signToken(user) });
  } catch (err) {
    if (err.code === 11000)
      // duplicate email
      return res.status(409).json({ error: "Email already exists" });
    return res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await user.comparePassword(password); // uses method in model
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    return res.json({ token: signToken(user) });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}

/* ---------- Exports ---------- */
module.exports = { register, login };
