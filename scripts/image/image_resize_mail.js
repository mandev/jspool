importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.mail);
importPackage(Packages.com.adlitteram.jspool);

// Init 
MAIL_SERVER = "193.16.201.5";
MAIL_USER = "toto";
MAIL_PASSWD = "toto";
MAIL_FROM_USER = "toto@free.fr";

MAIL_TO = _getValue("MAIL_TO");
MAIL_SUBJECT = _getValue("MAIL_SUBJECT");
MAIL_MSG = _getValue("MAIL_MSG");
MAIL_ATTACH = _getValue("MAIL_ATTACH");

ERROR_DIR = _getValue("ERROR_DIR");
MAX_SIZE = _getValue("MAX_SIZE");
REL_SIZE = _getValue("REL_SIZE");

CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

// Resize Image with Image Magick
function convertImage(srcFile, dstFile) {
    var opt = [srcFile.getPath(), "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + srcFile);
    var status = _exec(CONVERT_EXE, opt, dstFile.getParent(), 30000); // 30 secondes time out
    if (status != 0) {
        _print("convertImage error!");
        FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName()));
    }
}

// Send Mail with attached file
function sendMail(file) {
    _print("Mail image " + file + " to " + MAIL_TO);

    var email = new MultiPartEmail();
    email.setDebug(true);
    email.setHostName(MAIL_SERVER);
    email.setAuthentication(MAIL_USER, MAIL_PASSWD);
    email.setFrom(MAIL_FROM_USER);
    email.addTo(MAIL_TO);
    email.setSubject(MAIL_SUBJECT);
    email.setMsg(MAIL_MSG);

    var attachment = new EmailAttachment();
    attachment.setPath(file.getPath());
    attachment.setDisposition(EmailAttachment.ATTACHMENT);
    attachment.setDescription(MAIL_ATTACH);
    attachment.setName(MAIL_ATTACH);
    email.attach(attachment);

    email.send();
    _print("Email sent");
}

// Resize and mail
function main() {

    // resize to temporary file
    var jpgFile = File.createTempFile("tmp_", ".jpg");
    jpgFile.deleteOnExit();

    _print("Converting image " + _srcFile.getName());
    convertImage(_srcFile.getFile(), jpgFile);
    sendMail(jpgFile);

    if (jpgFile.exists())
        FileUtils.forceDelete(jpgFile);
    return _OK;
}

// start & exit
try {
    _exit = main();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName()));
    _exit = _OK;
}
