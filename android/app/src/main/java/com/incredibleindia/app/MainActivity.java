package com.incredibleindia.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom plugins
        try {
            registerPlugin(NativeAuthPlugin.class);
            Log.d("MainActivity", "NativeAuthPlugin registered successfully");
        } catch (Exception e) {
            Log.e("MainActivity", "Error registering NativeAuthPlugin: " + e.getMessage());
        }
    }
}