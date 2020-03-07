package com.adlitteram.jspool.properties;

import com.adlitteram.jspool.gui.MainFrame;
import java.net.URI;
import org.slf4j.Logger;
import javax.xml.parsers.SAXParserFactory;
import org.slf4j.LoggerFactory;
import org.xml.sax.XMLReader;

public class XmlChannelReader {

    private static final Logger LOG = LoggerFactory.getLogger(XmlChannelReader.class);
    //

    public static boolean read(MainFrame frame, URI uri) {
        return (uri == null) ? false : read(frame, uri.toString());
    }

    public static boolean read(MainFrame frame, String uri) {

        try {
            XMLReader parser = SAXParserFactory.newInstance().newSAXParser().getXMLReader();
            XmlChannelHandler xh = new XmlChannelHandler(frame);
            parser.setContentHandler(xh);
            parser.setErrorHandler(xh);
            parser.setFeature("http://xml.org/sax/features/validation", false);
            parser.setFeature("http://xml.org/sax/features/namespaces", false);
            parser.setFeature("http://apache.org/xml/features/validation/schema", false);
            parser.parse(uri);
        }
        catch (org.xml.sax.SAXParseException spe) {
            LOG.warn("XmlPropertiesReader.read() : ", spe);
            return false;
        }
        catch (org.xml.sax.SAXException se) {
            LOG.warn("XmlPropertiesReader.read() : ", se);
            return false;
        }
        catch (Exception e) {
            LOG.warn("XmlPropertiesReader.read() : ", e);
            return false;
        }
        return true;
    }
}
