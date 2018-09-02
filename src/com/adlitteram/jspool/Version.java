/*
 * Version.java
 *
 * Created on 18 decembre 2004, 21:14
 */
package com.adlitteram.jspool;

public class Version {

    private static final String COPYRIGHT = "Tessier & Ashpool";
    private static final String DATE = "2016";
    private static final String AUTHOR = "Emmanuel Deviller";
    private static final String BUILD_NUM = "297";
    private static final String LICENCE = "Commercial";
    private static final String VERSION_NUM = "7.98";
    private static final String CNAME = "jSpool";
    private static final String NAME = "jSpool";

    public static String getCNAME() {
        return CNAME;
    }

    public static String getNAME() {
        return NAME;
    }

    public static String getCOPYRIGHT() {
        return COPYRIGHT;
    }

    public static String getDATE() {
        return DATE;
    }

    public static String getAUTHOR() {
        return AUTHOR;
    }

    public static String getBUILD() {
        return BUILD_NUM;
    }

    public static String getLICENCE() {
        return LICENCE;
    }

    public static String getRELEASE() {
        return VERSION_NUM;
    }

    public static String getVERSION() {
        return VERSION_NUM;
    }
}
