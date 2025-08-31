package com.incredibleindia.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.auth.AuthCredential;
import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;
import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;

import android.content.Intent;
import android.util.Log;

import java.util.Arrays;

@CapacitorPlugin(name = "NativeAuth")
public class NativeAuthPlugin extends Plugin {
    
    private FirebaseAuth firebaseAuth;
    private GoogleSignInClient googleSignInClient;
    private CallbackManager callbackManager;
    private static final int RC_SIGN_IN = 9001;
    private static final String TAG = "NativeAuthPlugin";
    private PluginCall savedCall;
    
    @Override
    public void load() {
        firebaseAuth = FirebaseAuth.getInstance();
        
        try {
            // Configure Google Sign-In with proper Web Client ID
            String webClientId = "684013360789-bm40qnps10c4ngi5fivu4paa9k4vc8k6.apps.googleusercontent.com"; // Should be properly configured
            
            // Check if we have a valid web client ID
            if (webClientId != null && !webClientId.equals("YOUR_ACTUAL_WEB_CLIENT_ID")) {
                GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestIdToken(webClientId)
                        .requestEmail()
                        .build();
                
                googleSignInClient = GoogleSignIn.getClient(this.getActivity(), gso);
            } else {
                Log.e(TAG, "Invalid Web Client ID. Please configure in NativeAuthPlugin.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring Google Sign-In: " + e.getMessage());
        }
        
        // Initialize Facebook SDK
        try {
            FacebookSdk.sdkInitialize(this.getContext());
            AppEventsLogger.activateApp(this.getActivity().getApplication());
            callbackManager = CallbackManager.Factory.create();
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Facebook SDK: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void signInWithGoogle(PluginCall call) {
        // Save the call for later use
        this.savedCall = call;
        
        // Start Google Sign-In intent
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, RC_SIGN_IN);
    }
    
    @PluginMethod
    public void signInWithFacebook(PluginCall call) {
        // Save the call for later use
        this.savedCall = call;
        
        // Start Facebook Login
        LoginManager.getInstance().logInWithReadPermissions(this.getActivity(), Arrays.asList("email", "public_profile"));
    }
    
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        } else {
            callbackManager.onActivityResult(requestCode, resultCode, data);
        }
    }
    
    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            firebaseAuthWithGoogle(account);
        } catch (ApiException e) {
            Log.w(TAG, "signInResult:failed code=" + e.getStatusCode());
            // Reject the saved call
            if (savedCall != null) {
                savedCall.reject("Google sign in failed: " + e.getMessage());
                savedCall = null;
            }
        }
    }
    
    private void firebaseAuthWithGoogle(GoogleSignInAccount acct) {
        Log.d(TAG, "firebaseAuthWithGoogle:" + acct.getId());
        
        AuthCredential credential = GoogleAuthProvider.getCredential(acct.getIdToken(), null);
        firebaseAuth.signInWithCredential(credential)
                .addOnCompleteListener(this.getActivity(), task -> {
                    if (task.isSuccessful()) {
                        Log.d(TAG, "signInWithCredential:success");
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        
                        // Resolve the saved call
                        if (savedCall != null) {
                            JSObject ret = new JSObject();
                            ret.put("uid", user.getUid());
                            ret.put("email", user.getEmail());
                            ret.put("displayName", user.getDisplayName());
                            ret.put("photoURL", user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : null);
                            savedCall.resolve(ret);
                            savedCall = null;
                        }
                    } else {
                        Log.w(TAG, "signInWithCredential:failure", task.getException());
                        // Reject the saved call
                        if (savedCall != null) {
                            savedCall.reject("Firebase authentication failed: " + task.getException().getMessage());
                            savedCall = null;
                        }
                    }
                });
    }
}