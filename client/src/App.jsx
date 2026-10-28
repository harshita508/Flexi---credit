import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Compass,
  Headphones,
  Heart,
  Leaf,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const categories = ["All places", "Beach", "Culture", "Nature"];
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }
  return payload;
}

function App() {
  const [destinations, setDestinations] = useState([]);
  const [destinationState, setDestinationState] = useState("loading");
  const [activeCategory, setActiveCategory] = useState("All places");
  const [search, setSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [lookup, setLookup] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadDestinations() {
    setDestinationState("loading");
    try {
      const data = await apiRequest("/api/destinations");
      setDestinations(data.destinations);
      setDestinationState("ready");
    } catch (error) {
      setDestinationState(error.message);
    }
  }

  useEffect(() => {
    loadDestinations();
  }, []);

  const visibleDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return destinations.filter((destination) => {
      const categoryMatches =
        activeCategory === "All places" ||
        destination.category.toLowerCase() === activeCategory.toLowerCase();
      const searchMatches =
        !query ||
        `${destination.name} ${destination.country} ${destination.region} ${destination.category}`
          .toLowerCase()
          .includes(query);
      return categoryMatches && searchMatches;
    });
  }, [activeCategory, destinations, search]);

  function startBooking(destination) {
    setSelectedDestination(destination);
    setBooking(null);
    setBookingError("");
    document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitBooking(event) {
    event.preventDefault();
    setBookingError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    payload.travelers = Number(payload.travelers);
    payload.destinationId = selectedDestination._id;
    payload.acceptTerms = form.get("acceptTerms") === "on";

    try {
      const data = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setBooking(data.booking);
      formElement.reset();
    } catch (error) {
      setBookingError(error.message);
    }
  }

  async function submitLookup(event) {
    event.preventDefault();
    setLookupError("");
    setLookup(null);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiRequest("/api/bookings/lookup", {
        method: "POST",
        body: JSON.stringify({
          bookingCode: form.get("bookingCode"),
          email: form.get("lookupEmail"),
        }),
      });
      setLookup(data.booking);
    } catch (error) {
      setLookupError(error.message);
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#" aria-label="FLEXI Travel home">
          <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
          <span>FLEXI<span className="brand-light"> travel</span></span>
        </a>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={menuOpen ? "main-nav open" : "main-nav"}>
          <a href="#destinations" onClick={() => setMenuOpen(false)}>Destinations</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>Our story</a>
          <a href="#manage" onClick={() => setMenuOpen(false)}>Manage booking</a>
          <a className="nav-cta" href="#plan" onClick={() => setMenuOpen(false)}>Plan your trip <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</div>
            <h1>Find your<br /><em>somewhere.</em></h1>
            <p className="hero-description">
              Not just a trip. A collection of moments that stay with you long after you come home.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#destinations">Explore destinations <ArrowRight size={16} /></a>
              <span className="hero-note"><span className="avatar-stack"><i>✦</i><i>✦</i><i>✦</i></span> Loved by curious travellers</span>
            </div>
            <div className="hero-stats">
              <div><strong>28<span>+</span></strong><small>handpicked places</small></div>
              <span className="stat-divider" />
              <div><strong>4.9<span>/5</span></strong><small>traveller rating</small></div>
              <span className="stat-divider" />
              <div><strong>12k<span>+</span></strong><small>happy memories</small></div>
            </div>
          </div>
          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1400&q=85"
              alt="Tropical beach in Bali with turquoise water and palm trees"
            />
            <div className="hero-image-shade" />
            <div className="image-location"><MapPin size={14} /> Uluwatu, Bali</div>
            <div className="floating-card">
              <div className="floating-icon"><Sparkles size={17} /></div>
              <div><small>THE FEEL-GOOD PICK</small><strong>A little more wonder</strong></div>
              <ArrowUpRight size={17} />
            </div>
            <span className="hero-image-index">01 <i /> 04</span>
          </div>
          <a className="scroll-cue" href="#destinations"><ArrowDown size={14} /> SCROLL TO EXPLORE</a>
        </section>

        <section className="trust-strip" aria-label="Why travel with FLEXI">
          <div><ShieldCheck size={18} /><span>Thoughtfully planned</span></div>
          <i />
          <div><Heart size={18} /><span>Made for real moments</span></div>
          <i />
          <div><Headphones size={18} /><span>Here when you need us</span></div>
          <i />
          <div><Leaf size={18} /><span>Travel a little lighter</span></div>
        </section>

        <section className="destinations-section section-wrap" id="destinations">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> SOMEWHERE SPECIAL</div>
              <h2>Places with a <em>feeling.</em></h2>
            </div>
            <p>Every place has a story. Find one that feels a little like yours.</p>
          </div>
          <div className="destination-controls">
            <div className="category-tabs" role="tablist" aria-label="Filter destinations">
              {categories.map((category) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={activeCategory === category ? "category-tab active" : "category-tab"}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >{category}</button>
              ))}
            </div>
            <label className="search-box">
              <Search size={16} />
              <input
                type="search"
                placeholder="Find your place"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {destinationState === "loading" && <div className="notice">Finding your next favourite place…</div>}
          {destinationState !== "loading" && destinationState !== "ready" && (
            <div className="notice error-notice">
              <span>We couldn’t load the destinations. {destinationState}</span>
              <button className="text-button" type="button" onClick={loadDestinations}>Try again</button>
            </div>
          )}
          {destinationState === "ready" && visibleDestinations.length === 0 && (
            <div className="notice">No places match that search. Try another destination.</div>
          )}
          {destinationState === "ready" && visibleDestinations.length > 0 && (
            <div className="destination-grid">
              {visibleDestinations.map((destination, index) => (
                <article className={`destination-card card-${index % 3}`} key={destination._id}>
                  <button
                    className="destination-photo-button"
                    type="button"
                    onClick={() => startBooking(destination)}
                    aria-label={`Plan a trip to ${destination.name}`}
                  >
                    <img src={destination.image} alt={`${destination.name}, ${destination.country}`} loading="lazy" />
                    <span className="card-category">{destination.category}</span>
                    <span className="card-photo-arrow"><ArrowUpRight size={17} /></span>
                  </button>
                  <div className="destination-info">
                    <div className="destination-title">
                      <div><h3>{destination.name}</h3><span><MapPin size={12} /> {destination.region}, {destination.country}</span></div>
                      <span className="rating"><Star size={13} fill="currentColor" /> {destination.rating}</span>
                    </div>
                    <p>{destination.description}</p>
                    <div className="destination-footer">
                      <span>From <strong>{currency.format(destination.priceFrom)}</strong> <small>/ person</small></span>
                      <button type="button" onClick={() => startBooking(destination)}>Explore <ArrowRight size={14} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="destination-bottom"><span>GOOD THINGS TAKE YOU PLACES</span><span>{visibleDestinations.length} CURATED GETAWAYS <i /></span></div>
        </section>

        <section className="story-section" id="about">
          <div className="story-image-wrap">
            <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85" alt="Peaceful mountain lake surrounded by green hills" loading="lazy" />
            <div className="story-stamp"><span>GO<br />SLOW</span><Leaf size={18} /></div>
          </div>
          <div className="story-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A DIFFERENT KIND OF TRAVEL</div>
            <h2>Less itinerary.<br /><em>More instinct.</em></h2>
            <p>We believe the best travel stories aren’t about ticking boxes. They’re the long lunch that turns into sunset, the local who points you down a different road, the feeling of being exactly where you’re meant to be.</p>
            <a className="story-link" href="#plan">Get to know us <ArrowRight size={15} /></a>
            <div className="story-quote"><span>“</span><p>The best souvenirs are the stories you didn’t plan to make.</p></div>
          </div>
        </section>

        <section className="booking-section section-wrap" id="plan">
          <div className="booking-intro">
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR ADVENTURE, YOUR WAY</div>
            <h2>Let’s make<br />a little <em>magic.</em></h2>
            <p>Tell us what you’re dreaming of. Our travel people will help make it feel like yours.</p>
            <div className="booking-promise"><ShieldCheck size={17} /><span>Your details are private and secure.</span></div>
          </div>
          <div className="booking-panel">
            {booking ? (
              <div className="success-panel" role="status">
                <span className="success-icon"><Check size={24} /></span>
                <div className="eyebrow">IT’S OFFICIALLY A PLAN</div>
                <h3>Thank you, {booking.name.split(" ")[0]}.</h3>
                <p>Your trip request is saved. Keep this reference safe to look up your booking later.</p>
                <div className="reference-code"><small>YOUR BOOKING REFERENCE</small><strong>{booking.bookingCode}</strong></div>
                <button type="button" className="text-button" onClick={() => { setBooking(null); setSelectedDestination(null); }}>Plan another trip <ArrowRight size={14} /></button>
              </div>
            ) : (
              <form className="booking-form" onSubmit={submitBooking}>
                <div className="form-heading"><div><span>01 — YOUR TRIP</span><h3>Start with the details.</h3></div><span className="form-required">* Required</span></div>
                <label className="field-label">Where are you dreaming of going? <span>*</span>
                  <span className="select-wrap">
                    <select
                      required
                      value={selectedDestination?._id ?? ""}
                      onChange={(event) => setSelectedDestination(destinations.find((item) => item._id === event.target.value) ?? null)}
                    >
                      <option value="" disabled>Choose a destination</option>
                      {destinations.map((destination) => <option value={destination._id} key={destination._id}>{destination.name}, {destination.country}</option>)}
                    </select>
                    <ChevronDown size={16} />
                  </span>
                </label>
                <div className="field-row">
                  <label className="field-label">Your name <span>*</span><input name="name" autoComplete="name" placeholder="How should we call you?" minLength="2" maxLength="80" required /></label>
                  <label className="field-label">Email address <span>*</span><input type="email" name="email" autoComplete="email" placeholder="you@example.com" maxLength="254" required /></label>
                </div>
                <div className="field-row">
                  <label className="field-label">Phone number <span>*</span><input type="tel" name="phone" autoComplete="tel" placeholder="+91 98765 43210" minLength="7" maxLength="25" required /></label>
                  <label className="field-label">When would you like to go? <span>*</span><input type="date" name="travelDate" min={new Date().toISOString().slice(0, 10)} required /></label>
                </div>
                <div className="field-row field-row-bottom">
                  <label className="field-label">Number of travellers <span>*</span>
                    <span className="select-wrap">
                      <select name="travelers" defaultValue="2" required>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? "traveller" : "travellers"}</option>)}</select>
                      <ChevronDown size={16} />
                    </span>
                  </label>
                  <label className="field-label">Anything else we should know? <small>OPTIONAL</small><input name="note" maxLength="500" placeholder="A special occasion, a must-see, your travel style…" /></label>
                </div>
                {bookingError && <p className="form-error" role="alert">{bookingError}</p>}
                <div className="form-submit-row">
                  <label className="terms-check"><input type="checkbox" name="acceptTerms" required /><span>I agree to be contacted about this trip request.</span></label>
                  <button className="button button-dark" type="submit">Send my trip request <ArrowRight size={15} /></button>
                </div>
                <p className="form-footnote"><ShieldCheck size={13} /> Your details are only used to help plan your trip.</p>
              </form>
            )}
          </div>
        </section>

        <section className="manage-section" id="manage">
          <div className="manage-inner">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> ALREADY GOING SOMEWHERE?</div>
              <h2>Your plans, <em>at a glance.</em></h2>
              <p>Look up a trip request with your booking reference and the email you used.</p>
            </div>
            <form className="lookup-form" onSubmit={submitLookup}>
              <label>Booking reference<input name="bookingCode" placeholder="FLEXI-…" required /></label>
              <label>Email address<input name="lookupEmail" type="email" placeholder="you@example.com" required /></label>
              <button className="button button-dark" type="submit">Find my trip <Search size={15} /></button>
              {lookupError && <p className="form-error lookup-result" role="alert">{lookupError}</p>}
              {lookup && <div className="lookup-result lookup-success" role="status"><Check size={16} /><span><strong>{lookup.destination}</strong> · {lookup.travelDate} · {lookup.travelers} traveller{lookup.travelers === 1 ? "" : "s"} · {lookup.status}</span></div>}
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><Compass size={20} /></span><span>FLEXI<span className="brand-light"> travel</span></span></a>
        <span>Go where you feel. © {new Date().getFullYear()} FLEXI Travel.</span>
        <a href="#destinations">Back to the good stuff ↑</a>
      </footer>
    </>
  );
}

export default App;
