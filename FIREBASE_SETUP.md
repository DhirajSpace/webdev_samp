# Firebase Setup Guide

This guide will help you set up Firebase for your Cyber Safety Portal project.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "cyber-safety-portal")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## Step 3: Create Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## Step 4: Get Your Firebase Configuration

1. In your Firebase project, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (</>)
4. Enter an app nickname (e.g., "cyber-safety-web")
5. Click "Register app"
6. Copy the Firebase configuration object

## Step 5: Update Your Configuration

Replace the placeholder values in your HTML files with your actual Firebase configuration:

### In `index.html` and `register.html`:
```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## Step 6: Set Up Firestore Security Rules (Optional)

For production, you should set up proper security rules. In Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 7: Test Your Integration

1. Open `index.html` in your browser
2. Try registering a new account
3. Try logging in with the registered account
4. Check your Firebase Console to see the user in Authentication and data in Firestore

## Features Implemented

### Authentication
- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ User logout
- ✅ Session management
- ✅ Error handling for common auth errors

### Database
- ✅ User profile storage in Firestore
- ✅ Course completion tracking
- ✅ Quiz scores storage
- ✅ User preferences

### UI/UX
- ✅ Loading states during authentication
- ✅ Success/error message display
- ✅ Form validation
- ✅ Terms and conditions checkbox
- ✅ Responsive design

## Next Steps

Once you have Firebase set up, you can:

1. Add more user data fields
2. Implement course progress tracking
3. Add quiz result storage
4. Set up user preferences
5. Add password reset functionality
6. Implement email verification

## Troubleshooting

### Common Issues:

1. **"Firebase not defined" error**: Make sure you've replaced the placeholder configuration with your actual Firebase config.

2. **Authentication not working**: Check that Email/Password authentication is enabled in your Firebase Console.

3. **Database permission denied**: Make sure your Firestore rules allow authenticated users to read/write data.

4. **CORS errors**: Make sure you're serving your files from a web server (not opening HTML files directly).

### Testing Locally:

You can use a simple HTTP server to test your Firebase integration:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have it installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Security Notes

- Never commit your actual Firebase configuration to public repositories
- Use environment variables for production deployments
- Set up proper Firestore security rules
- Consider implementing email verification for production use
