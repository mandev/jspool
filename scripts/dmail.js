/* dmail.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ; 
importPackage(Packages.org.apache.commons.mail) ; 

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init 
MAIL_SERVER="smtp.free.fr" ;     // adresse du serveur smtp
MAIL_USER="toto" ;               // authentification smtp : user
MAIL_PASSWD="tutu" ;             // authentification smtp : password
MAIL_FROM_USER="toto@free.fr" ;  // moi

// toUser : adresse du destinataire
// file : pièce jointe
function sendMail(toUser, file, sujet, corps) {

   // Create the email message
   try {
      var email = new MultiPartEmail();
      //email.setDebug(true) ;
      email.setHostName(MAIL_SERVER);
      //email.setAuthentication(MAIL_USER, MAIL_PASSWD) ;
      email.setFrom(MAIL_FROM_USER);

      email.addTo(toUser);
      email.setSubject(sujet);
      email.setMsg(corps);

      var attachment = new EmailAttachment();
      attachment.setPath(file.getPath());
      attachment.setDisposition(EmailAttachment.ATTACHMENT);
      attachment.setDescription("Attachement");
      attachment.setName(file.getName());
      email.attach(attachment);

      email.send();
      return _OK ;
   }
   catch (exception) {
      _print("sendMail: " + exception);
      return _FAIL ;
   } 
}

// Copy the srcfile to outputdir 
// Append the src directory name to the destination filename
function main() {

      var filename = _srcFile.getName() ;
      var i0 = filename.indexOf("~") ;
      if ( i0 > 0 ) {
         var toUser=filename.substring(0,i0) + "@free.fr" ;
         var sujet="Ceci est le sujet" ;
         var corps="Ceci est le corps du message." ;

         // don't use _srcFile.getFile() with ftp source !!!!
         _print("Envoi mail : " + toUser + " - " + filename) ;
         return sendMail(toUser, _srcFile.getFile(), sujet, corps) ;
      }
      else {
         _print("sendMail: le fichier n'a pas de préfix - " + filename );
         // faire un mail à l'administrateur par ex. !
         return _FAIL ;
      }
}

// start & exit 
_exit = main() ; 

