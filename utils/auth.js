import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "858885524799-nl8nqlmd1i07pi13a2atg3r9apm7c29u.apps.googleusercontent.com",
});

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Get the users ID token
    const signInResult = await GoogleSignin.signIn();
    console.log("response : ", signInResult);
    let idToken = signInResult.data?.idToken;
    if (!idToken) {
      throw new Error("No ID token found");
    }
    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    return auth().signInWithCredential(googleCredential);
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          console.log("Sign-in already in progress");
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.log("Play services not available");
          break;
        default:
          console.log("Google sign-in error:", error);
      }
    } else {
      console.log("Unexpected error:", error);
    }
  }
};

export const signOutUser = async () => {
  try {
    // await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    // Also sign out from Firebase
    await auth().signOut();
  } catch (error) {
    console.error(error);
  }
};
