/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool.mail;

import com.adlitteram.jasmin.utils.StrUtils;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import javax.mail.Address;
import javax.mail.BodyPart;
import javax.mail.Flags;
import javax.mail.Folder;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.Part;
import javax.mail.Session;
import javax.mail.Store;
import javax.mail.internet.AddressException;
import nu.xom.Attribute;
import nu.xom.Document;
import nu.xom.Element;
import nu.xom.Serializer;
import org.slf4j.LoggerFactory;

/**
 *
 * @author EDEVILLER
 */
public class MailConnexion {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(MailConnexion.class);
    //
    private static final Pattern pattern = Pattern.compile("[\\000]*");
    //
    private String host;
    private String userName;
    private String password;
    private String dir;
    private Folder folder;
    private Store store;
    private String mode;
    private boolean flush = false;

    public MailConnexion(String host, String userName, String password, String dir, String mode) {
        this.host = host;
        this.userName = userName;
        this.password = password;
        this.dir = dir;
        this.mode = mode;
    }

    public String getDir() {
        return dir;
    }

    public String getHost() {
        return host;
    }

    public String getUserName() {
        return userName;
    }

    public boolean isConnected() {
        return (store != null && store.isConnected());
    }

    public String getMode() {
        return mode;
    }

    public void connect() throws MessagingException {
        if (store == null || !store.isConnected()) {
            logger.info("Connexion " + mode + ": {}@{}", userName, host);
            Session session = Session.getInstance(new Properties(), null);
            //session.setDebug(true);
            store = session.getStore(mode);
            store.connect(host, userName, password);
            folder = store.getFolder("Inbox");
            folder.open(Folder.READ_WRITE);
        }
    }

    public void flush() {
        if (flush) {
            close();
        }
    }

    public void close() {
        try {
            if (folder != null && folder.isOpen()) {
                folder.close(true);
            }
            if (store != null) {
                store.close();
            }
        }
        catch (MessagingException ex) {
            logger.warn("", ex);
        }
    }

    public int getCount() throws MessagingException, IOException {
        connect();
        return folder.getMessageCount();
    }

    public File getFirstEmail() throws MessagingException, IOException {
        return getEmail(0);
    }

    public File getEmail(int c) throws MessagingException, IOException {
        connect();

        File tmpFile = null;

        int count = folder.getMessageCount();
        if (count >= c) {

            tmpFile = File.createTempFile("email_", ".zip");
            tmpFile.deleteOnExit();
            Message aMessage;
            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(tmpFile))) {
                zos.setLevel(Deflater.DEFAULT_COMPRESSION);
                aMessage = folder.getMessage(c);
                String senderAddress = "unknown";
                Address[] adr = null;
                try {
                    adr = aMessage.getFrom();
                }
                catch (AddressException ex) {
                    logger.info(ex.getMessage());
                }
                if (adr != null && adr.length > 0) {
                    senderAddress = adr[0].toString();
                }
                String subject = aMessage.getSubject();


                String toAddresses = "";
                try {
                    Address[] listTO = aMessage.getRecipients(Message.RecipientType.TO);
                    if (listTO != null) {
                        for (int toCount = 0; toCount < listTO.length; toCount++) {
                            toAddresses += listTO[toCount].toString() + ", ";
                        }
                    }
                    if (toAddresses.length() > 1) {
                        toAddresses = toAddresses.substring(0, toAddresses.length() - 2);
                    }
                }
                catch (AddressException ex) {
                    logger.info(ex.getMessage());
                }

                String ccAddresses = "";
                try {
                    Address[] listCC = aMessage.getRecipients(Message.RecipientType.CC);
                    if (listCC != null) {
                        for (int ccCount = 0; ccCount < listCC.length; ccCount++) {
                            ccAddresses = listCC[ccCount].toString() + ", ";
                        }
                    }
                    if (ccAddresses.length() > 1) {
                        ccAddresses = ccAddresses.substring(0, ccAddresses.length() - 2);
                    }
                }
                catch (AddressException ex) {
                    logger.info(ex.getMessage());
                }

                String sentDate = (aMessage.getSentDate() != null) ? aMessage.getSentDate().toString() : "";
                ArrayList<String> attachementList = new ArrayList<>();
                ArrayList<TextContent> textContentList = new ArrayList<>();
                processContent(aMessage, attachementList, textContentList, zos);
                logger.info(senderAddress + " - " + subject);
                Element mailElement = new Element("mail");
                mailElement.appendChild(createElement("sentdate", cleanString(sentDate)));
                mailElement.appendChild(createElement("from", cleanString(senderAddress)));
                mailElement.appendChild(createElement("to", cleanString(toAddresses)));
                mailElement.appendChild(createElement("cc", cleanString(ccAddresses)));
                mailElement.appendChild(createElement("subject", cleanString(subject)));
                Element atsElement = new Element("attachments");
                for (String at : attachementList) {
                    atsElement.appendChild(createElement("attachment", cleanString(at)));
                }
                mailElement.appendChild(atsElement);
                Element msgsElement = new Element("texts");
                for (TextContent tc : textContentList) {
                    Element msgElement = createElement("text", cleanString(tc.getText()));
                    msgElement.addAttribute(new Attribute("mimetype", tc.getMimeType()));
                    msgsElement.appendChild(msgElement);
                }
                mailElement.appendChild(msgsElement);
                zos.putNextEntry(new ZipEntry("mail.xml"));
                Serializer serializer = new Serializer(zos, "UTF-8");
                serializer.setIndent(4);
                serializer.setMaxLength(64);
                serializer.write(new Document(mailElement));
                zos.closeEntry();
            }

            aMessage.setFlag(Flags.Flag.DELETED, true);
            flush = true;
        }
        else {
            logger.info("MessageCount: {} - Num: {}", count, c);
        }

        return tmpFile;
    }

    private void processContent(Part part, ArrayList<String> atList, ArrayList<TextContent> tcList, ZipOutputStream zos) throws MessagingException, IOException {

        String contentType = part.getContentType();
        if (contentType.contains("text/plain") || contentType.contains("text/html")) {
            try {
                Object content = part.getContent();
                if (content != null) {
                    tcList.add(new TextContent(contentType, content.toString()));
                }
            }
            catch (UnsupportedEncodingException ex) {
                logger.info(ex.getMessage());
            }
        }
        else if (contentType.contains("multipart")) {
            Multipart multipart = (Multipart) part.getContent();
            int numberOfParts = multipart.getCount();
            for (int i = 0; i < numberOfParts; i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);

                if (Part.ATTACHMENT.equalsIgnoreCase(bodyPart.getDisposition())) {
                    String name = bodyPart.getFileName() == null ? "part_" + i : StrUtils.toFilename(bodyPart.getFileName());
                    atList.add(name);
                    storeAttachment(bodyPart, name, zos);
                }
                else if (Part.INLINE.equalsIgnoreCase(bodyPart.getDisposition())) {
                    // TODO: store inline object 
                    //logger.info("Part.INLINE: " + bodyPart.getDisposition());
                }
                else {
                    processContent(bodyPart, atList, tcList, zos);
                }
            }
        }
    }

    private String cleanString(String str) {
        if (str != null) {
            Matcher matcher = pattern.matcher(str);
            return matcher.find() ? matcher.replaceAll("") : str;
        }
        return str;
    }

    private Element createElement(String tag, String value) {
        Element element = new Element(tag);
        element.appendChild(value);
        return element;
    }

    /**
     * Saves an attachment part to a file on disk
     *
     * @param part a part of the e-mail's multipart content.
     * @throws MessagingException
     * @throws IOException
     */
    private void storeAttachment(BodyPart part, String name, ZipOutputStream zos) throws MessagingException, IOException {

        try {
            name = StrUtils.toFilename(name);
            zos.putNextEntry(new ZipEntry(name));
            InputStream input = part.getInputStream();
            byte[] buffer = new byte[4096];
            int byteRead;
            while ((byteRead = input.read(buffer)) != -1) {
                zos.write(buffer, 0, byteRead);
            }
        }
        finally {
            zos.closeEntry();
        }
    }

    private class TextContent {

        private String mimeType;
        private String text;

        public TextContent(String mimeType, String text) {
            this.mimeType = mimeType;
            this.text = text;
        }

        public String getMimeType() {
            return mimeType;
        }

        public String getText() {
            return text;
        }
    }
}
//        if (pop3Store == null || !pop3Store.isConnected()) {
//            logger.info("Connexion pop3: {}@{}", userName, host);
//            Properties properties = new Properties();
//            properties.put("mail.pop3.host", host);
//
//
//            // connects to the POP3 server
//            Session session = Session.getDefaultInstance(properties);
//            pop3Store = (POP3Store) session.getStore("pop3");
//            pop3Store.connect(userName, password);
//
//            pop3Folder = pop3Store.getFolder(dir);
//            pop3Folder.open(Folder.READ_WRITE);
//            //pop3Folder.open(Folder.READ_ONLY);
//        }
//            // properties.put("mail.pop3.port", "995");
//            // sets POP3S properties
//            // properties.setProperty("mail.pop3.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
//            // properties.setProperty("mail.pop3.socketFactory.fallback", "false");
//            // properties.setProperty("mail.pop3.socketFactory.port", "995");        
//props.setProperty("mail.imaps.port", "143");
//        props.put("mail.imaps.socketFactory.class", "javax.net.tls.TLSSocketFactory");
//        props.put("mail.imaps.auth.plain.disable", "true");
//        props.put("mail.imaps.auth.ntlm.disable", "true");
//        props.put("mail.imaps.starttls.enable", "true");
//        props.put("mail.imaps.host", "10.196.50.183");
//        props.put("mail.imaps.port", "143");
//        props.put("mail.imaps.starttls.enable", "true");
//        props.put("mail.imaps.starttls.required", "true");
//        props.put("ssl.SocketFactory.provider", "com.adlitteram.jspool.mail.ExchangeSSLSocketFactory");
//        props.put("mail.imaps.socketFactory.class", "com.adlitteram.jspool.mail.ExchangeSSLSocketFactory");
//        props.put("mail.imaps.socketFactory.fallback", "false");
//        props.put("mail.imaps.sasl.enable", "true");
//        props.put("mail.imaps.sasl.mechanisms", "GSSAPI");
//        props.put("mail.imaps.sasl.authorizationid","edeviller");
//        props.put("mail.imaps.sasl.realm","PARISIEN");
