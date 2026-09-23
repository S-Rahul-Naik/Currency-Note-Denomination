# DhanDrishti / Currency Vision

## Project Presentation Pitch

### One-line pitch

DhanDrishti is an accessibility-first currency assistant that uses computer vision, voice interaction, and currency conversion to help people identify banknotes independently and confidently.

## The Problem

Identifying an unfamiliar banknote is difficult for people with visual impairments and inconvenient for anyone handling multiple currencies. Existing solutions often split the task across separate tools:

- One tool identifies a note.
- Another performs currency conversion.
- A third provides voice assistance.
- Previous results are difficult to review or are not stored securely.

This creates friction at the exact moment the user needs a fast, clear, and trustworthy answer.

## Our Solution

DhanDrishti brings the complete workflow into one application. A user points a phone camera at a banknote, and the system:

1. Captures the banknote image.
2. Detects its currency and denomination using a trained YOLO ONNX model.
3. Reports the confidence of the result.
4. Converts the value into the user’s preferred currency.
5. Announces the result through localized voice output.
6. Saves the detection to the user’s personal history.

The interface is designed around large controls, simple navigation, language preferences, voice feedback, and reduced visual complexity.

## Target Users

- People with visual impairments who need independent banknote recognition.
- Travelers handling unfamiliar currencies.
- Retail and cash-handling users who need a quick denomination check.
- Students and researchers exploring practical computer vision applications.

## What Makes It Different

### Accessibility is the starting point

Voice feedback, browser speech recognition, large interaction targets, language support, and a straightforward scanning flow are core product decisions rather than optional add-ons.

### Recognition and conversion are connected

The user does not need to copy the detected amount into a separate calculator. Detection and conversion happen in the same result flow.

### It supports a complete user journey

The application includes onboarding, preferences, authentication, scanning, results, conversion, voice settings, history, profile management, and counterfeit-checking views.

### It is designed for local and service-assisted operation

The ONNX model can run in the browser for the standalone demo. The full application can use a Node/Express API for server-side inference, MongoDB persistence, and secure voice-provider access.

## Supported Recognition Scope

The current model contains 36 banknote classes across six currencies:

- USD
- PHP
- INR
- EUR
- AUD
- CAD

Supported denominations are defined in `Currency_Vision/dataset.yaml` and must remain aligned with the class map in `Currency_Vision/src/banknotes.ts`.

## User Experience Flow

```mermaid
flowchart LR
    A[Open application] --> B[Choose language and preferences]
    B --> C[Open camera scanner]
    C --> D[Capture banknote frame]
    D --> E[YOLO ONNX detection]
    E --> F[Currency and denomination result]
    F --> G[Convert to preferred currency]
    G --> H[Speak result]
    H --> I[Save to account history]
```

## Technology

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide icons
- Browser camera and speech-recognition APIs

### Computer vision

- YOLO-based currency detection
- ONNX model execution
- ONNX Runtime WebAssembly for the standalone browser demo
- ONNX Runtime Node for the Express inference API
- Sharp for image resizing and RGB preprocessing

### Backend and data

- Node.js and Express
- MongoDB for users and account-specific history
- Node.js `scrypt` password hashing
- ElevenLabs proxy for optional text-to-speech and transcription
- Exchange-rate service for conversion

## System Flow

```text
Camera or uploaded image
        |
        v
React scanner or browser demo
        |
        v
Image preprocessing: resize, RGB conversion, normalization
        |
        v
YOLO ONNX model
        |
        v
Currency, denomination, confidence
        |
        +--> Conversion result
        +--> Localized voice announcement
        +--> Account history
        +--> Counterfeit/security workflow
```

## Demonstration Script

### Opening

“Imagine receiving a banknote that you cannot identify by sight. You need to know its value immediately, and you do not want to depend on another person or switch between several applications.”

### Problem

“Currency recognition, conversion, and voice assistance are usually disconnected. That makes a simple cash interaction slower and less independent.”

### Product demonstration

“With DhanDrishti, the user opens the scanner and points the camera at a banknote. The system detects the currency and denomination, displays the confidence, converts the amount to the preferred currency, speaks the result in the selected language, and stores the activity in personal history.”

### Technology explanation

“The recognition engine uses a trained YOLO model exported to ONNX. The application can run inference in the browser or through a Node API. This gives us a practical balance between local processing, deployment flexibility, and integration with account history and voice services.”

### Closing

“DhanDrishti is more than a detector. It is a single, accessible workflow that helps users recognize, understand, and manage currency independently.”

## Product Value

### For users

- Faster banknote identification.
- More independence during everyday transactions.
- Spoken results for users who do not rely on visual interfaces.
- Immediate conversion into a familiar currency.
- Personal history for reviewing previous detections.

### For institutions and partners

- A clear applied-AI accessibility use case.
- Modular architecture that can support additional currencies and models.
- A browser-friendly ONNX deployment path.
- A backend integration path for persistence and managed services.

### For the project team

- Demonstrates model training and model deployment.
- Combines computer vision, frontend engineering, backend APIs, databases, and voice technology.
- Provides measurable areas for future evaluation: accuracy, latency, accessibility, and language coverage.

## Current Capabilities

- 36-class banknote recognition.
- Six supported currencies.
- Image upload and camera scanning paths.
- Single, multiple, and automatic detection modes.
- Confidence filtering and low-confidence guidance.
- Currency conversion.
- User signup and login.
- MongoDB-backed profile and detection history.
- Localized interface and result messaging.
- Optional ElevenLabs voice synthesis and transcription.
- Counterfeit/security-check application views.

## Roadmap

### Near term

- Expand and rebalance the training dataset across lighting, angles, folds, and note conditions.
- Add a formal evaluation report with precision, recall, confusion matrix, and latency measurements.
- Improve camera framing guidance and continuous scanning feedback.
- Add automated integration tests for the inference and history APIs.

### Medium term

- Add more currencies and denominations.
- Improve counterfeit detection with validated security-feature data.
- Add stronger server-side sessions and signed authentication tokens.
- Provide offline conversion-rate snapshots with visible freshness indicators.
- Package the experience for mobile deployment.

### Long term

- Personalize voice and interaction settings for individual accessibility needs.
- Add robust offline inference and offline voice prompts.
- Partner with accessibility organizations for usability testing.
- Evaluate the system with real users across different devices and environments.

## Responsible Use

The application should support, not replace, human judgment in high-risk financial situations. Camera quality, lighting, note condition, occlusion, and model coverage can affect recognition. Production deployment should include broader validation, explicit uncertainty messaging, strong authentication, encrypted transport, and privacy review for stored history and voice data.

## Closing Statement

DhanDrishti combines computer vision and accessible interaction design to solve a practical problem: recognizing and understanding currency without unnecessary dependence on others. Its modular architecture makes the project ready for continued model improvement, wider currency coverage, and real-world accessibility evaluation.

## 30-Second Version

“DhanDrishti is an accessibility-first currency assistant for people who need a faster and more independent way to identify banknotes. Using a camera and a trained YOLO ONNX model, it recognizes currency and denomination, reports confidence, converts the value into a preferred currency, speaks the result in the user’s language, and stores the detection history. It combines computer vision, React, Node, MongoDB, and voice technology in one practical workflow.”
