# Image Converter

Application de conversion d'images moderne avec support de tous les formats.

## Fonctionnalités

- **Conversion multi-formats** : PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, AVIF et plus
- **Upload multiple** : Glissez-déposez ou sélectionnez plusieurs fichiers
- **Progression en temps réel** : Suivi individuel et global via WebSocket
- **Qualité ajustable** : Contrôlez la compression pour JPEG/WebP
- **Téléchargement flexible** : Individuel ou groupe (ZIP)
- **Interface moderne** : Design épuré avec TailwindCSS

## Stack Technique

### Backend
- **Express** + TypeScript
- **Sharp** - Moteur de conversion rapide (formats courants)
- **ImageMagick** - Fallback pour formats exotiques
- **Socket.io** - Progression en temps réel
- **Multer** - Upload de fichiers
- **Archiver** - Création de ZIP

### Frontend
- **React 18** + TypeScript + Vite
- **TailwindCSS** - Styling
- **Lucide Icons** - Icônes
- **Axios** - Requêtes HTTP
- **Socket.io-client** - WebSocket

## Installation

### Backend
```bash
cd server
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Frontend
```bash
cd web
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`

## Utilisation

1. **Sélectionnez le format** de sortie souhaité
2. **Ajustez la qualité** (pour JPEG/WebP)
3. **Glissez vos images** ou cliquez pour parcourir
4. **Cliquez "Convertir"** pour lancer la conversion
5. **Téléchargez** individuellement ou tous en ZIP

## Développement

### Structure des fichiers
```
.
├── server/              # Backend Express
│   └── src/
│       ├── middleware/  # Multer config
│       ├── routes/      # API endpoints
│       └── services/    # Conversion logic
├── web/                 # Frontend React
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom hooks
│       └── types/       # TypeScript types
└── README.md
```

### API Endpoints

- `POST /api/upload` - Upload des fichiers
- `POST /api/convert` - Lancer la conversion
- `GET /api/download/:id` - Télécharger un fichier
- `POST /api/download-all` - Télécharger tout en ZIP
- WebSocket `/ws` - Progression en temps réel

## Auteur

Créé avec Claude Code + Subagent-Driven Development
