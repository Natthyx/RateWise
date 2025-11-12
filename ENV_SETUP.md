# Backend Environment Setup

## Create .env File

You need to create a `.env` file in the `ratewise/backend/` directory with the following content:

```
PORT=4000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_API_KEY=your_api_key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id","private_key_id":"your_private_key_id","private_key":"-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n","client_email":"your_client_email","client_id":"your_client_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your_client_x509_cert_url"}
FIREBASE_STORAGE_BUCKET=your_storage_bucket
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
```

## How to Get Firebase Credentials

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create a new project** or select existing one
3. **Enable Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode"
4. **Enable Firebase Storage**:
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
5. **Get API Key**:
   - Go to Project Settings (gear icon)
   - Go to "General" tab
   - Copy "Web API Key"
6. **Generate Service Account**:
   - Go to Project Settings
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Download the JSON file
   - Copy the entire JSON content to FIREBASE_SERVICE_ACCOUNT

## Example Values

Replace the placeholder values with your actual Firebase project details:

- `your_project_id`: Your Firebase project ID
- `your_api_key`: Your Firebase Web API Key
- `your_storage_bucket`: Usually `your_project_id.appspot.com`
- `your_jwt_secret_key_here_make_it_long_and_random`: A long random string for JWT signing

## File Location

The `.env` file should be located at:
```
ratewise/backend/.env
```

## Security Note

Never commit the `.env` file to version control. It contains sensitive credentials.



