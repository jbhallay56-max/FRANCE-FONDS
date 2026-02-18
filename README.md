# FRANCE — Site full-stack (prototype sérieux)

Ce pack contient :
- `/public` : ton site (HTML/CSS/JS) identique au design v5/v6
- `/server` : backend Node/Express + SQLite (comptes réels, hash mot de passe, session cookie JWT, reset mdp)

## 1) Installer
1. Installe Node.js (LTS)
2. Dans le dossier du projet :
   - `cp .env.example .env`
   - modifie `JWT_SECRET` (obligatoire)

## 2) Lancer en local
- `npm install`
- `npm run dev`
Puis ouvre : http://localhost:3000

## 3) Comptes
- Créer un compte : onglet "Créer un compte"
- Connexion : onglet "Espace client"

## 4) Mot de passe oublié
- Sur la page login : "Mot de passe oublié"
- Le lien est affiché dans la console si SMTP non configuré
- Page de reset : `/reset-password.html` (formulaire)

## 5) Production (vraie sécurité)
- Mettre `secure: true` sur les cookies derrière HTTPS
- Utiliser une base Postgres (Render/Railway)
- Ajouter un vrai mailer (nodemailer ou provider)
- Ajouter 2FA si besoin
