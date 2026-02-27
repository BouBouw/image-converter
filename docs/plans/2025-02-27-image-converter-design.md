# Design - Convertisseur d'Images

**Date** : 2025-02-27
**Auteur** : Claude + User
**Statut** : Validé - Prêt pour implémentation

## Vue d'Ensemble

Convertisseur d'images moderne permettant la conversion de fichiers multiples vers un format cible avec progression en temps réel et téléchargement groupé (ZIP).

## Architecture Générale

### Backend (Express + Node.js)

**Stack Technique** :
- Express.js - Framework web
- TypeScript - Typage statique
- Multer - Upload de fichiers
- Sharp - Moteur de conversion principal (rapide)
- ImageMagick - Fallback pour formats exotiques
- Socket.io - WebSocket pour progression temps réel
- Archiver - Création de ZIP

**Endpoints API** :
- `POST /upload` - Upload des fichiers
- `POST /convert` - Lancer les conversions
- `GET /download/:id` - Télécharger un fichier converti
- `POST /download-all` - Télécharger tout en ZIP
- WebSocket `/ws` - Progression temps réel

**Gestion des fichiers** :
- Stockage temporaire dans `/tmp/uploads/` et `/tmp/converted/`
- Suppression automatique après téléchargement ou 1h
- Cleanup via tâche planifiée

### Frontend (React + Vite)

**Stack Technique** :
- React 18 avec TypeScript
- Vite - Build tool
- TailwindCSS - Styling
- Lucide React - Icônes
- Axios - Requêtes HTTP
- Socket.io-client - WebSocket

**Structure des composants** :
- `App.tsx` - Layout global
- `ImageConverter.tsx` - Composant principal
- `FormatSelector.tsx` - Sélecteur de format
- `DropZone.tsx` - Zone drag & drop
- `FileList.tsx` - Liste des fichiers
- `ProgressBar.tsx` - Barres de progression
- `DownloadButtons.tsx` - Boutons téléchargement

## Flux de Données

### Backend - Pipeline de Conversion

```
1. Upload (POST /upload)
   ├─ Multer接收 fichiers
   ├─ Génère IDs uniques
   ├─ Sauvegarde dans /tmp/uploads/
   └─ Retourne { fileIds, files }

2. Conversion (POST /convert)
   ├─ Reçoit { fileIds, targetFormat, quality }
   ├─ Lance conversions parallèles
   ├─ Sharp pour formats courants
   ├─ ImageMagick fallback
   └─ WebSocket émet progression

3. Progression (WebSocket)
   └─ Événement: progress:{conversionId}
       { fileId, progress, status, error? }

4. Téléchargement (GET /download/:id)
   ├─ Retourne fichier converti
   └─ Supprime après envoi

5. Téléchargement ZIP (POST /download-all)
   ├─ Crée ZIP avec tous les fichiers
   ├─ Stream le ZIP
   └─ Supprime fichiers après envoi
```

### Frontend - Gestion d'État

**État global** :
```typescript
interface State {
  files: FileWithMetadata[];
  conversions: Map<fileId, ConversionStatus>;
  globalProgress: { completed: number; total: number };
  convertedFiles: Map<fileId, ConvertedFile>;
  selectedFormat: string;
  quality: number;
}
```

**Types de progression** :
- `pending` - En attente
- `converting` - En cours de conversion
- `completed` - Terminé avec succès
- `error` - Erreur

## Fonctionnalités

### Formats Supportés

**Formats principaux (Sharp)** :
- PNG, JPEG, WebP, AVIF, TIFF, GIF

**Formats étendus (ImageMagick)** :
- BMP, ICO, PSD, RAW, PDF, SVG, EPS, et 200+ autres formats

### Options de Conversion

- **Qualité** : 0-100% pour JPEG/WebP (défaut: 85%)
- **Préservation** : Transparence, métadonnées EXIF, animations GIF

### Gestion des Erreurs

- **Détection automatique** : Formats non supportés, fichiers corrompus
- **Conversion partielle** : Continue pour autres fichiers
- **Réessai** : Bouton relance par fichier échoué
- **Feedback visuel** : Badges colorés + messages d'erreur

### Cas Particuliers

- **Noms dupliqués** : Suffixe unique (image-1.png, image-2.png)
- **Même format** : Copie directe optimisée
- **GIF animés** : Préservation des animations
- **Fichiers volumineux** : Limite 50MB par fichier

## Design Visuel

### Palette de Couleurs (TailwindCSS)

- Primary : `indigo-600`
- Background : `gray-50`
- Surface : `white`
- Success : `green-500`
- Error : `red-500`
- Warning : `yellow-500`

### Layout

- Header centré avec titre + icône
- Carte principale `max-w-4xl mx-auto`
- Design responsive (mobile-first)

### Composants Visuels

**DropZone** :
- Bordure pointillée `border-gray-300`
- Hover `border-indigo-500 bg-indigo-50`
- Icône `Upload` + texte explicite

**Progression** :
- Barre globale pleine largeur
- Barres individuelles par fichier
- Texte "3/5 fichiers (60%)"

**Boutons** :
- "Convertir" : Primary, désactivé si pas de fichiers
- "Télécharger tout (ZIP)" : Apparaît si ≥2 fichiers
- Boutons individuels : Petit, icône `Download`

## Structure Technique

### Backend

```
server/
├── src/
│   ├── index.ts              # Express entry point
│   ├── routes/
│   │   ├── convert.ts        # Routes principales
│   │   └── progress.ts       # WebSocket
│   ├── services/
│   │   ├── converter.ts      # Logique conversion
│   │   ├── fileManager.ts    # Gestion fichiers
│   │   └── zipper.ts         # Création ZIP
│   ├── middleware/
│   │   └── upload.ts         # Config Multer
│   └── utils/
│       ├── formatDetection.ts
│       └── cleanup.ts        # Tâche planifiée
├── package.json
└── tsconfig.json
```

**Dépendances Backend** :
```json
{
  "express": "^4.18.2",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0",
  "imagemagick": "^0.1.3",
  "socket.io": "^4.6.1",
  "archiver": "^6.0.1",
  "cors": "^2.8.5",
  "typescript": "^5.3.3"
}
```

### Frontend

```
web/src/
├── App.tsx
├── components/
│   ├── ImageConverter.tsx
│   ├── FormatSelector.tsx
│   ├── DropZone.tsx
│   ├── FileList.tsx
│   ├── ProgressBar.tsx
│   └── DownloadButtons.tsx
├── hooks/
│   ├── useWebSocket.ts
│   └── useConversion.ts
├── types/
│   └── conversion.ts
└── main.tsx
```

**Dépendances Frontend** (ajouts) :
```json
{
  "axios": "^1.6.2",
  "socket.io-client": "^4.6.1",
  "lucide-react": "^0.294.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.1.0"
}
```

## Implémentation

### Priorités

1. **Backend** :
   - Setup Express + TypeScript
   - Implémentation endpoints upload/convert
   - Intégration Sharp + ImageMagick
   - WebSocket progression

2. **Frontend** :
   - Setup composants de base
   - Intégration DropZone
   - Gestion d'état conversion
   - WebSocket + progression temps réel

3. **Finitions** :
   - Design TailwindCSS
   - Gestion erreurs
   - Tests
   - Optimisations

### Critères de Succès

- ✅ Conversion de tous les formats d'image
- ✅ Upload multiple fonctionnel
- ✅ Progression temps réelle
- ✅ Téléchargement individuel et ZIP
- ✅ Interface moderne et responsive
- ✅ Gestion robuste des erreurs
