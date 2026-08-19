package com.jobclokr.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePrintPlugin.class);

        super.onCreate(savedInstanceState);

        WebView.setWebContentsDebuggingEnabled(true);
    }
}