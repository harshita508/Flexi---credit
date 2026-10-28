import "dotenv/config";
import { randomBytes } from "node:crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { z } from "zod";
import Booking from "./models/Booking.js";
import Destination from "./models/Destination.js";
import { destinationSeed } from "./data/destinations.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("This website origin is not allowed."));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json({ limit: "10kb", strict: true }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many booking attempts. Please wait a little and try again." },
});

const bookingInput = z
  .object({
    destinationId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid destination."),
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(25).regex(/^[+()\d.\-\s]+$/, "Enter a valid phone number."),
    travelDate: z
      .string()
      .date()
      .refine((date) => date >= new Date().toISOString().slice(0, 10), "Travel date must be today or later."),
    travelers: z.number().int().min(1).max(12),
    note: z.string().trim().max(500).optional().default(""),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Please agree before sending your trip request." }) }),
  })
  .strict();

const lookupInput = z
  .object({
    bookingCode: z.string().trim().toUpperCase().regex(/^FLEXI-[A-F0-9]{32}$/),
    email: z.string().trim().email().max(254),
  })
  .strict();

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.get("/api/destinations", async (_request, response, next) => {
  try {
    const destinations = await Destination.find()
      .select("name country region category description priceFrom duration rating image highlight featured")
      .sort({ featured: -1, name: 1 })
      .lean();
    response.json({ destinations });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings", bookingLimiter, async (request, response, next) => {
  const parsed = bookingInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      message: parsed.error.issues[0]?.message || "Please check your trip details.",
      errors: parsed.error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
    });
    return;
  }

  try {
    const { destinationId, acceptTerms: _acceptTerms, ...details } = parsed.data;
    const destination = await Destination.findById(destinationId).select("name").lean();
    if (!destination) {
      response.status(400).json({ message: "That destination is no longer available. Please choose another." });
      return;
    }

    const savedBooking = await Booking.create({
      ...details,
      destination: destination._id,
      bookingCode: `FLEXI-${randomBytes(16).toString("hex").toUpperCase()}`,
    });
    response.status(201).json({
      booking: {
        bookingCode: savedBooking.bookingCode,
        name: savedBooking.name,
        destination: destination.name,
        travelDate: savedBooking.travelDate.toISOString().slice(0, 10),
        travelers: savedBooking.travelers,
        status: savedBooking.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings/lookup", bookingLimiter, async (request, response, next) => {
  const parsed = lookupInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Enter a valid booking reference and email address." });
    return;
  }

  try {
    const booking = await Booking.findOne({
      bookingCode: parsed.data.bookingCode,
      email: parsed.data.email.toLowerCase(),
    })
      .populate("destination", "name country")
      .select("bookingCode destination travelDate travelers status createdAt")
      .lean();

    if (!booking) {
      response.status(404).json({ message: "We couldn’t find a trip with those details. Check your reference and email." });
      return;
    }

    response.json({
      booking: {
        bookingCode: booking.bookingCode,
        destination: booking.destination.name,
        country: booking.destination.country,
        travelDate: booking.travelDate.toISOString().slice(0, 10),
        travelers: booking.travelers,
        status: booking.status,
        requestedAt: booking.createdAt.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ message: "That API endpoint doesn’t exist." });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ message: "Request body must be valid JSON." });
    return;
  }
  if (error.message === "This website origin is not allowed.") {
    response.status(403).json({ message: "This website origin is not allowed." });
    return;
  }
  console.error("API request failed:", error);
  response.status(500).json({ message: "We couldn’t complete that request. Please try again." });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required. Copy server/.env.example to server/.env and configure MongoDB.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(
    destinationSeed.map(({ slug, ...destination }) =>
      Destination.updateOne({ slug }, { $set: destination, $setOnInsert: { slug } }, { upsert: true }),
    ),
  );
  app.listen(port, () => {
    console.log(`FLEXI API listening on http://localhost:${port}`);
    console.log(`MongoDB connected; ${destinationSeed.length} destinations are ready.`);
  });
}

start().catch((error) => {
  console.error("Could not start FLEXI API:", error.message);
  process.exitCode = 1;
});
