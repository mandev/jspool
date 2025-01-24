package com.adlitteram.jspool.properties;

import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.MainFrame;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

public class XmlChannelHandler extends DefaultHandler {

  private static final Logger LOG = LoggerFactory.getLogger(XmlChannelHandler.class);

  private final Map<Object, Object> props;
  private final MainFrame frame;

  public XmlChannelHandler(MainFrame frame) {
    this.frame = frame;
    props = new HashMap<>();
  }

  @Override
  public void startElement(String uri, String local, String raw, Attributes attrs) {
    if ("channel".equalsIgnoreCase(raw)) {
      for (int i = 0; i < attrs.getLength(); i++) {
        props.put(attrs.getQName(i), attrs.getValue(i));
      }

      Channel channel = new Channel(frame, props);
      channel.setStatus(
          channel.getBooleanProp(Channel.DISABLED, false) ? Channel.DISABLE : Channel.STOP);

      frame.addLogArea(channel);
      frame.getChannels().add(channel);
      props.clear();
    }
  }

  @Override
  public void warning(SAXParseException ex) {
    LOG.warn("[Warning] " + getLocationString(ex), ex);
  }

  @Override
  public void error(SAXParseException ex) {
    LOG.warn("[Error] " + getLocationString(ex), ex);
  }

  @Override
  public void fatalError(SAXParseException ex) throws SAXException {
    LOG.warn("[Fatal Error] " + getLocationString(ex), ex);
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
