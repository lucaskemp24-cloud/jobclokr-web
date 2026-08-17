package com.jobclokr.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {

    private WebView printWebView;

    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html");
        String jobName = call.getString(
            "jobName",
            "JobClokr Report"
        );

        if (html == null || html.trim().isEmpty()) {
            call.reject("Print HTML is required.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                printWebView =
                    new WebView(getActivity());

                printWebView.getSettings()
                    .setJavaScriptEnabled(false);

                printWebView.setWebViewClient(
                    new WebViewClient() {

                        @Override
                        public void onPageFinished(
                            WebView view,
                            String url
                        ) {
                            try {
                                PrintManager printManager =
                                    (PrintManager)
                                        getActivity()
                                            .getSystemService(
                                                Context.PRINT_SERVICE
                                            );

                                if (printManager == null) {
                                    printWebView = null;

                                    call.reject(
                                        "Android print service is unavailable."
                                    );

                                    return;
                                }

                                PrintDocumentAdapter adapter =
                                    view.createPrintDocumentAdapter(
                                        jobName
                                    );

                                PrintAttributes attributes =
                                    new PrintAttributes.Builder()
                                        .setMediaSize(
                                            PrintAttributes
                                                .MediaSize
                                                .NA_LETTER
                                        )
                                        .setColorMode(
                                            PrintAttributes
                                                .COLOR_MODE_COLOR
                                        )
                                        .build();

                                printManager.print(
                                    jobName,
                                    adapter,
                                    attributes
                                );

                                JSObject result =
                                    new JSObject();

                                result.put(
                                    "started",
                                    true
                                );

                                call.resolve(result);

                            } catch (Exception error) {
                                call.reject(
                                    "Unable to start Android print job.",
                                    error
                                );
                            } finally {
                                printWebView = null;
                            }
                        }
                    }
                );

                printWebView.loadDataWithBaseURL(
                    null,
                    html,
                    "text/html",
                    "UTF-8",
                    null
                );

            } catch (Exception error) {
                printWebView = null;

                call.reject(
                    "Unable to prepare Android print job.",
                    error
                );
            }
        });
    }
}