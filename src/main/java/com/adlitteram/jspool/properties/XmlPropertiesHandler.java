package com.adlitteram.jspool.properties;

import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

public class XmlPropertiesHandler extends DefaultHandler {

  private static final Logger LOG = LoggerFactory.getLogger(XmlPropertiesHandler.class);
  private final Properties props;

  public XmlPropertiesHandler(Properties props) {
    this.props = props;
  }

  @Override
  public void startElement(String uri, String local, String raw, Attributes attrs) {
    if ("property".equalsIgnoreCase(raw)) {
      Object key = attrs.getValue("key");
      Object value = attrs.getValue("value");
      if (key != null) {
        props.put(key, value);
      }
    }
  }

  @Override
  public void warning(SAXParseException ex) {
    LOG.warn(getLocationString(ex), ex);
  }

  @Override
  public void error(SAXParseException ex) {
    LOG.warn(getLocationString(ex), ex);
  }

  @Override
  public void fatalError(SAXParseException ex) throws SAXException {
    LOG.warn(getLocationString(ex), ex);
  }

  // Returns a string of the location.
  private String getLocationString(SAXParseException ex) {
    StringBuilder str = new StringBuilder();

    String systemId = ex.getSystemId();
    if (systemId != null) {
      int index = systemId.lastIndexOf('/');
      if (index != -1) {
        systemId = systemId.substring(index + 1);
      }
      str.append(systemId);
    }
    str.append(':').append(ex.getLineNumber());
    str.append(':').append(ex.getColumnNumber());
    return str.toString();
  }
}
