import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 25 },
    travelDate: { type: Date, required: true },
    travelers: { type: Number, required: true, min: 1, max: 12 },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["received", "planning", "confirmed"], default: "received" },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Booking", bookingSchema);
