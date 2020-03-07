package com.adlitteram.jspool;

public class Main {

    private static MainApplication application;

    public static void main(String[] args) {
        application = new MainApplication(args);
        application.init();
        application.start();
    }

    public static MainApplication getApplication() {
        return application;
    }
}
