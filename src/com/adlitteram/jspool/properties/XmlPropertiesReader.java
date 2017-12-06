/**
 * Copyright (C) 1999-2002 Emmanuel Deviller
 *
 * @version 1.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.properties;

import java.net.URL;
import java.util.Properties;

import org.xml.sax.*;
import javax.xml.parsers.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class XmlPropertiesReader {

    private static final Logger logger = LoggerFactory.getLogger(XmlPropertiesReader.class);

    public static boolean read(Properties props, URL url) {
        return (url == null) ? false : read(props, url.toString());
    }

    public static boolean read(Properties props, String uri) {

        try {
            XMLReader parser = SAXParserFactory.newInstance().newSAXParser().getXMLReader();
            XmlPropertiesHandler xh = new XmlPropertiesHandler(props);
            parser.setContentHandler(xh);
            parser.setErrorHandler(xh);
            parser.setFeature("http://xml.org/sax/features/validation", false);
            parser.setFeature("http://xml.org/sax/features/namespaces", false);
            parser.parse(uri);
        }
        catch (org.xml.sax.SAXParseException spe) {
            logger.warn("XmlPropertiesReader.read(1)", spe);
            return false;
        }
        catch (org.xml.sax.SAXException se) {
            Exception e = se.getException();
            logger.warn("XmlPropertiesReader.read(2)", e != null ? e : se);
            return false;
        }
        catch (Exception e) {
            logger.warn("XmlPropertiesReader.read(3)", e);
            return false;
        }
        return true;
    }
}
