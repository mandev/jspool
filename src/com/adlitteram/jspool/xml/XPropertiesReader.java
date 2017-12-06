/**
 * Copyright (C) 1999-2002 Emmanuel Deviller
 *
 * @version 1.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.xml;

import java.io.IOException;
import java.io.Reader;
import java.net.URI;
import java.util.Properties;
import javax.xml.parsers.ParserConfigurationException;

import javax.xml.parsers.SAXParserFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;

//static final String DEFAULT_PARSER_NAME = "javax.xml.parsers.SAXParser";
//XMLReader parser = (XMLReader)Class.forName(DEFAULT_PARSER_NAME).newInstance();
//static final String DEFAULT_PARSER_NAME = "org.apache.xerces.parsers.SAXParser";
//parser.setFeature("http://apache.org/xml/features/continue-after-fatal-error", false);
public class XPropertiesReader {

    private static final Logger logger = LoggerFactory.getLogger(XPropertiesReader.class);
    //

    public static boolean read(Properties props, String prefix, URI uri) {
        return (uri == null) ? false : read(props, prefix, new InputSource(uri.toString()));
    }

    public static boolean read(Properties props, String prefix, Reader characterStream) {
        return (characterStream == null) ? false : read(props, prefix, new InputSource(characterStream));
    }

    public static boolean read(Properties props, String prefix, InputSource inputSource) {

        try {
            XMLReader parser = SAXParserFactory.newInstance().newSAXParser().getXMLReader();
            XPropertiesHandler xh = new XPropertiesHandler(props, prefix);
            parser.setContentHandler(xh);
            parser.setErrorHandler(xh);
            parser.setFeature("http://xml.org/sax/features/validation", false);
            parser.setFeature("http://xml.org/sax/features/namespaces", false);
            parser.setFeature("http://apache.org/xml/features/validation/schema", false);
            parser.parse(inputSource);
        } catch (org.xml.sax.SAXParseException spe) {
            logger.warn("", spe);
            return false;
        } catch (org.xml.sax.SAXException se) {
            logger.warn("", se);
            return false;
        } catch (ParserConfigurationException | IOException e) {
            logger.warn("", e);
            return false;
        }
        return true;
    }
}
