import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["Beach", "Culture", "Nature"] },
    description: { type: String, required: true, trim: true },
    priceFrom: { type: Number, required: true, min: 0 },
    duration: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    image: { type: String, required: true },
    highlight: { type: String, required: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Destination", destinationSchema);
