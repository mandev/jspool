/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool;

/**
 *
 * @author EDEVILLER
 */
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
