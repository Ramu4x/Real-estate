const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["admin", "seller", "buyer"],
      default: "buyer"
    },
    phone: {
      type: String
    },
    avatar: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    preferences: {
      location: String,
      propertyType: String,
      minPrice: Number,
      maxPrice: Number
    },
    searchHistory: [{
      query: String,
      timestamp: { type: Date, default: Date.now }
    }],
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property"
    }]
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const password = this.password;
  if (typeof password === "string" && (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"))) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
