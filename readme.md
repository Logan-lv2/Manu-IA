# Manu-IA - Bot WhatsApp

Un bot WhatsApp utilisant la bibliothèque whatsapp-web.js avec des commandes pour la gestion de groupe, les jeux, la création de stickers, et le traitement des médias.

## Fonctionnalités

- **Commandes de base** : ping, menu, etc.
- **Jeu de devinette** : devinez un nombre entre 1 et 100
- **Création de stickers** : convertir des images en stickers
- **Administration de groupe** : promotion, rétrogradation, expulsion de membres
- **Messages automatiques** : messages de bienvenue et d'au revoir personnalisés
- **Mentions de groupe** : possibilité de mentionner tous les membres d'un groupe

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/Logan-lv2/Manu-IA.git
cd Manu-IA

# Installer les dépendances
npm install

# Lancer le bot
node index.js
```

## Configuration

Le bot utilise l'authentification par code d'appairage. Lors du premier démarrage :

1. Ouvrez WhatsApp sur votre téléphone
2. Allez dans Paramètres > Appareils liés > Lier un appareil
3. Utilisez le code d'appairage généré par le bot

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `!ping` | Tester si le bot est actif |
| `!menu` | Afficher le menu des commandes |
| `!game` | Démarrer un jeu de devinette |
| `!guess [nombre]` | Deviner le nombre dans le jeu |
| `!sticker` | Créer un sticker à partir d'une image |
| `!promote @user` | Promouvoir un utilisateur en admin |
| `!demote @user` | Rétrograder un admin |
| `!kick @user` | Expulser un utilisateur |
| `!welcome [texte]` | Définir le message de bienvenue |
| `!goodbye [texte]` | Définir le message d'au revoir |
| `!tagall` | Mentionner tous les membres |

## Prérequis

- Node.js v14 ou supérieur
- Une connexion internet stable
- Un compte WhatsApp actif

## Licence

MIT
