import db from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log("Seeding demo data...");

  // Clean existing data (optional, but good for consistent demos)
  db.exec("DELETE FROM reports");
  db.exec("DELETE FROM achievements");
  db.exec("DELETE FROM users WHERE email != 'admin@rescue.org'");

  const hashedRescuerPassword = '$2b$10$UOUczy7pOZN/VW659yRdGuKA.vPKHkWaUPBMtprCc4A11h.SqsHKu';
  const hashedCitizenPassword = '$2b$10$pcP70GgtZm9.4itFFb/LyORbHOrrOLOjDQCV3wSMg0QIHKlYIalV6';

  // Seed Users
  const rescuers = [
    { email: 'unit_alpha@rescue.org', password: hashedRescuerPassword, role: 'rescuer' },
    { email: 'unit_beta@rescue.org', password: hashedRescuerPassword, role: 'rescuer' },
    { email: 'unit_gamma@rescue.org', password: hashedRescuerPassword, role: 'rescuer' },
  ];

  for (const r of rescuers) {
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(r.email, r.password, r.role);
  }

  const citizens = [
    { email: 'jane@example.com', password: hashedCitizenPassword, role: 'citizen' },
    { email: 'mark@example.com', password: hashedCitizenPassword, role: 'citizen' },
  ];

  for (const c of citizens) {
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(c.email, c.password, c.role);
  }

  // Seed Reports
  const locations = [
    { lat: 14.4506, lng: 121.0116, addr: 'BF Homes, Parañaque' },
    { lat: 14.4793, lng: 120.9820, addr: 'Don Bosco, Parañaque' },
    { lat: 14.5008, lng: 121.0061, addr: 'Moonwalk, Parañaque' },
    { lat: 14.4826, lng: 121.0409, addr: 'Sun Valley, Parañaque' },
    { lat: 14.4697, lng: 120.9953, addr: 'San Antonio, Parañaque' },
    { lat: 14.4444, lng: 121.0333, addr: 'Sucat, Parañaque' },
  ];

  const animals = [
    { type: 'Dog', expr: 'Stressed', priority: 'high', title: 'Injured Golden Retriever' },
    { type: 'Cat', expr: 'Scared', priority: 'medium', title: 'Stray Kitten in Drain' },
    { type: 'Dog', expr: 'Aggressive', priority: 'high', title: 'Large Dog Blocking Alley' },
    { type: 'Dog', expr: 'Neutral', priority: 'low', title: 'Wandering Husky' },
    { type: 'Cat', expr: 'Happy', priority: 'low', title: 'Friendly Calico at Park' },
  ];

  for (let i = 0; i < 15; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const anim = animals[Math.floor(Math.random() * animals.length)];
    const status = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'][Math.floor(Math.random() * 5)];
    
    db.prepare(`
      INSERT INTO reports (
        title, description, location, latitude, longitude, 
        animal_type, ai_confidence, facial_expression, status, priority, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `).run(
      anim.title,
      `Observed ${anim.type.toLowerCase()} in ${loc.addr}. Seems ${anim.expr.toLowerCase()}.`,
      loc.addr,
      loc.lat + (Math.random() - 0.5) * 0.01,
      loc.lng + (Math.random() - 0.5) * 0.01,
      anim.type,
      0.85 + Math.random() * 0.1,
      anim.expr,
      status,
      anim.priority,
      `-${Math.floor(Math.random() * 7)} days`
    );
  }

  console.log("Demo data seeded successfully.");
}

seed();
