/* 
 * Send mail
 */

importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.mail);

// Init 
MAIL_SERVER = "smtp.free.fr";     // smtp server address
MAIL_USER = "toto";               // smtp user authentification 
MAIL_PASSWD = "tutu";             // smtp password authentification 
MAIL_FROM_USER = "me@free.fr";  // the sender

function sendMail(toUser, file, subject, message) {

    // Create the email message
    try {
        var email = new MultiPartEmail();
        //email.setDebug(true) ;
        email.setHostName(MAIL_SERVER);
        email.setAuthentication(MAIL_USER, MAIL_PASSWD);
        email.setFrom(MAIL_FROM_USER);

        email.addTo(toUser);
        email.setSubject(subject);
        email.setMsg(message);

        var attachment = new EmailAttachment();
        attachment.setPath(file.getPath());
        attachment.setDisposition(EmailAttachment.ATTACHMENT);
        attachment.setDescription("Attachement");
        attachment.setName(file.getName());
        email.attach(attachment);

        email.send();
        return _OK;
    } catch (exception) {
        _print("sendMail: " + exception);
        return _FAIL;
    }
}

function main() {
    var filename = _srcFile.getName();

    var toUser = filename + "@free.fr";
    var sujet = "Ceci est le sujet";
    var corps = "Ceci est le corps du message.";
    return sendMail(toUser, _srcFile.getFile(), sujet, corps);
}

// start & exit 
_exit = main();

