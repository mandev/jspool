package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.SourceFile;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import org.apache.commons.mail.EmailAttachment;
import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.MultiPartEmail;

public class MailSend extends AbstractTarget {

  public static final String MAIL_SERVER = "Mail.Server";
  public static final String MAIL_USER = "Mail.User";
  public static final String MAIL_PASSWD = "Mail.Password";
  public static final String MAIL_TO_USER1 = "Mail.ToUser1";
  public static final String MAIL_FROM_USER = "Mail.FromUser";
  public static final String MAIL_SUBJECT = "Mail.Subject";
  public static final String MAIL_MESSAGE = "Mail.Message";

  private JTextField serverField;
  private JTextField userField;
  private JPasswordField passwdField;
  private JTextField toUser1Field;
  private JTextField fromUserField;
  private JTextField subjectField;
  private JTextArea messageArea;

  @Override
  public String getName() {
    return "Mail";
  }

  @Override
  public void close() {
    // Do nothing
  }

  @Override
  public int run(String srcDir, SourceFile file) {

    // Create the attachment
    EmailAttachment attachment = new EmailAttachment();
    attachment.setPath(file.getFile().getPath());
    attachment.setDisposition(EmailAttachment.ATTACHMENT);
    attachment.setDescription(file.getName());
    attachment.setName(file.getName());

    // Create the email message
    try {
      MultiPartEmail email = new MultiPartEmail();
      email.setHostName(channel.getStringProp(MAIL_SERVER));

      String mailUser = channel.getStringProp(MAIL_USER);
      if (!mailUser.isEmpty()) {
        email.setAuthentication(mailUser, channel.getStringProp(MAIL_PASSWD));
      }

      String[] toUsers = channel.getStringProp(MAIL_TO_USER1).split(";");
      for (String toUser : toUsers) {
        if (!toUser.isEmpty()) {
          email.addTo(toUser);
        }
      }

      email.setFrom(channel.getStringProp(MAIL_FROM_USER));
      email.setSubject(channel.getStringProp(MAIL_SUBJECT));
      email.setMsg(channel.getStringProp(MAIL_MESSAGE));
      email.attach(attachment);

      String[] args2 = {file.getPath(), channel.getStringProp(MAIL_SERVER)};
      channel.logInfo(
          channel.getStringProp(Channel.ID) + " - " + Message.get("mail.sending", args2));

      email.send();
    } catch (EmailException e) {
      channel.logWarning(channel.getStringProp(Channel.ID) + " - ", e);
      return FAIL;
    }

    return OK;
  }

  @Override
  public JPanel buildPanel(Dialog parent) {
    serverField = new JTextField(channel.getStringProp(MAIL_SERVER), 30);
    userField = new JTextField(channel.getStringProp(MAIL_USER), 15);
    passwdField = new JPasswordField(channel.getStringProp(MAIL_PASSWD), 15);
    fromUserField = new JTextField(channel.getStringProp(MAIL_FROM_USER), 30);
    toUser1Field = new JTextField(channel.getStringProp(MAIL_TO_USER1), 30);
    subjectField = new JTextField(channel.getStringProp(MAIL_SUBJECT), 30);

    messageArea = new JTextArea(channel.getStringProp(MAIL_MESSAGE), 5, 30);
    messageArea.setLineWrap(true);
    messageArea.setWrapStyleWord(false);
    GuiUtils.invertFocusTraversalBehaviour(messageArea);

    int[] w = {5, 0, 5, 0, 5};
    int[] h = {5, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 5};
    HIGConstraints c0 = new HIGConstraints();
    HIGLayout l = new HIGLayout(w, h);
    l.setColumnWeight(4, 1);

    JPanel panel = new JPanel(l);
    panel.add(new JLabel(Message.get("mail.server")), c0.xy(2, 2, "r"));
    panel.add(serverField, c0.xy(4, 2, "l"));
    panel.add(new JLabel(Message.get("mail.user")), c0.xy(2, 3, "r"));
    panel.add(userField, c0.xy(4, 3, "l"));
    panel.add(new JLabel(Message.get("mail.passwd")), c0.xy(2, 4, "r"));
    panel.add(passwdField, c0.xy(4, 4, "l"));
    panel.add(new JLabel(Message.get("mail.fromuser")), c0.xy(2, 6, "r"));
    panel.add(fromUserField, c0.xy(4, 6, "lr"));
    panel.add(new JLabel(Message.get("mail.touser")), c0.xy(2, 7, "r"));
    panel.add(toUser1Field, c0.xy(4, 7, "lr"));
    panel.add(new JLabel(Message.get("mail.subject")), c0.xy(2, 9, "r"));
    panel.add(subjectField, c0.xy(4, 9, "lr"));
    panel.add(new JLabel(Message.get("mail.message")), c0.xy(2, 11, "r"));
    panel.add(new JScrollPane(messageArea), c0.xy(4, 11, "lr"));

    return panel;
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(MAIL_SERVER, serverField.getText());
    channel.setProperty(MAIL_USER, userField.getText());
    channel.setProperty(MAIL_PASSWD, new String(passwdField.getPassword()));
    channel.setProperty(MAIL_FROM_USER, fromUserField.getText());
    channel.setProperty(MAIL_TO_USER1, toUser1Field.getText());
    channel.setProperty(MAIL_SUBJECT, subjectField.getText());
    channel.setProperty(MAIL_MESSAGE, messageArea.getText());
    return true;
  }
}
