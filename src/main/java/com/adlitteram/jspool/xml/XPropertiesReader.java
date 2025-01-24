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
import org.xml.sax.SAXException;
import org.xml.sax.XMLReader;

public class XPropertiesReader {

  private static final Logger LOG = LoggerFactory.getLogger(XPropertiesReader.class);

  public static boolean read(Properties props, String prefix, URI uri) {
    return uri != null && read(props, prefix, new InputSource(uri.toString()));
  }

  public static boolean read(Properties props, String prefix, Reader characterStream) {
    return characterStream != null && read(props, prefix, new InputSource(characterStream));
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
    } catch (SAXException | ParserConfigurationException | IOException se) {
      LOG.warn("", se);
      return false;
    }
    return true;
  }
}
