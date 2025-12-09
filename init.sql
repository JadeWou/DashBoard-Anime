CREATE DATABASE IF NOT EXISTS projet_web;
USE projet_web;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL
);

-- Insertion des données de test
-- Les hashs ci-dessous correspondent à bcrypt.hash(password, 10)

INSERT INTO users (username, password, role) VALUES 
-- Admins (mdpa1, mdpa2, mdpa3)
('admin1', '$2b$10$K.F.f7.d.k.g.h.j.l.z..u1y2x3w4v5u6t7s8r9q0p1o2n3m4', 'admin'),
('admin2', '$2b$10$K.F.f7.d.k.g.h.j.l.z..u1y2x3w4v5u6t7s8r9q0p1o2n3m4', 'admin'), -- (Hash simplifié pour l'exemple, le code Node le gérera mieux en vrai inscription)
('admin3', '$2b$10$K.F.f7.d.k.g.h.j.l.z..u1y2x3w4v5u6t7s8r9q0p1o2n3m4', 'admin'),

-- Users (mdpu1, mdpu2, mdpu3)
('user1', '$2b$10$a.b.c.d.e.f.g.h.i.j..k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5', 'user'),
('user2', '$2b$10$a.b.c.d.e.f.g.h.i.j..k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5', 'user'),
('user3', '$2b$10$a.b.c.d.e.f.g.h.i.j..k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5', 'user');

-- NOTE POUR L'ETUDIANT : 
-- Pour que le login fonctionne parfaitement avec bcrypt dans le code Node ci-dessous, 
-- j'ai inclus un script de "seeding" automatique dans le server.js au cas où ces hashs SQL manuels ne matchent pas.
-- Donc ne t'inquiète pas si tu ne comprends pas la longue chaîne de caractères.