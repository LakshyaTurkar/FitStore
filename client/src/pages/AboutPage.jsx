import { Link } from 'react-router-dom';
import { Dumbbell, HeartPulse, ShieldCheck, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

const IMAGE = 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1400&q=80';

export default function AboutPage() {
  useDocumentTitle('About Us');
  return (
    <>
      <PageHeader eyebrow="Our story" title="About FitStore" subtitle="Fuel Your Fitness Journey." />
      <div className="container section">
        <div className="about">
          <img src={IMAGE} alt="A modern gym with training equipment" className="about__img" />
          <div className="prose">
            <h2>Who we are</h2>
            <p>
              FitStore is an online store for fitness enthusiasts - from beginners setting up a home workout corner to athletes
              training every day. We bring gym equipment, supplements, sportswear, sports shoes and recovery gear together in one
              simple, fast shopping experience.
            </p>
            <p>
              <strong>Note:</strong> FitStore is a college project built with the MERN stack (MongoDB, Express, React, Node.js)
              to demonstrate secure e-commerce features: Google Sign-In, a server-side cart, Razorpay payments in test mode,
              transactional emails and an admin panel.
            </p>
            <h2>What we stand for</h2>
          </div>
        </div>
        <div className="features features--light">
          <div className="feature"><Dumbbell size={28} /><h3>Quality first</h3><p>Every product is selected for durability, comfort and performance.</p></div>
          <div className="feature"><HeartPulse size={28} /><h3>Health for all</h3><p>Affordable gear that helps more people start and stay active.</p></div>
          <div className="feature"><ShieldCheck size={28} /><h3>Secure by design</h3><p>Verified sign-in, server-side pricing and verified payments.</p></div>
          <div className="feature"><Users size={28} /><h3>Customer focus</h3><p>Clear policies, order tracking and friendly support.</p></div>
        </div>
        <p className="center"><Link to="/shop" className="btn btn--primary btn--lg">Start shopping</Link></p>
      </div>
    </>
  );
}
