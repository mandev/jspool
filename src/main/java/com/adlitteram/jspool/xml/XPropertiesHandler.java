package com.adlitteram.jspool.xml;

import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

public class XPropertiesHandler extends DefaultHandler {

    private static final Logger LOG = LoggerFactory.getLogger(XPropertiesHandler.class);

    private Properties props;
    private StringBuffer buffer;
    private String key;
    private String prefix;

    public XPropertiesHandler(Properties props) {
        this(props, "");
    }

    public XPropertiesHandler(Properties props, String prefix) {
        this.props = props;
        this.prefix = prefix;
    }

    @Override
    public void startElement(String uri, String local, String raw, Attributes attrs) {
        if ("property".equalsIgnoreCase(raw)) {
            props.put(attrs.getValue("name"), attrs.getValue("value"));
        }
        else if ("entry".equalsIgnoreCase(raw)) {
            key = attrs.getValue("key");
            buffer = new StringBuffer();
        }
        else if ("comment".equalsIgnoreCase(raw)) {
            buffer = new StringBuffer();
        }
    }

    @Override
    public void endElement(String uri, String local, String raw) {
        if ("entry".equalsIgnoreCase(raw)) {
            props.put(prefix + key, buffer.toString());
        }
        else if ("comment".equalsIgnoreCase(raw)) {
            props.put("COMMENT", buffer.toString());
        }
    }

    @Override
    public void characters(char ch[], int start, int length) {
        if (buffer != null) {
            buffer.append(ch, start, length);
        }
    }

    @Override
    public void ignorableWhitespace(char ch[], int start, int length) {
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
