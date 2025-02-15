package com.adlitteram.jspool.mail;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import javax.net.SocketFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class ExchangeSSLSocketFactory extends SSLSocketFactory {

  private final SSLSocketFactory sslSocketFactory;
  private final SocketFactory socketFactory;

  public ExchangeSSLSocketFactory() {
    try {
      socketFactory = SocketFactory.getDefault();

      SSLContext context = SSLContext.getInstance("TLS");
      context.init(null, new TrustManager[] {new EmptyTrustManager()}, null);
      sslSocketFactory = context.getSocketFactory();
    } catch (NoSuchAlgorithmException | KeyManagementException e) {
      throw new RuntimeException(e);
    }
  }

  private static final class EmptyTrustManager implements X509TrustManager {

    @Override
    public void checkClientTrusted(X509Certificate[] cert, String authType)
        throws CertificateException {}

    @Override
    public void checkServerTrusted(X509Certificate[] cert, String authType)
        throws CertificateException {}

    @Override
    public X509Certificate[] getAcceptedIssuers() {
      return new java.security.cert.X509Certificate[0];
    }
  }

  public static SocketFactory getDefault() {
    return new ExchangeSSLSocketFactory();
  }

  @Override
  public Socket createSocket(Socket socket, String s, int i, boolean flag) throws IOException {
    return sslSocketFactory.createSocket(socket, s, i, flag);
  }

  @Override
  public Socket createSocket(InetAddress inaddr, int i, InetAddress inaddr1, int j)
      throws IOException {
    return socketFactory.createSocket(inaddr, i, inaddr1, j);
  }

  @Override
  public Socket createSocket(InetAddress inaddr, int i) throws IOException {
    return socketFactory.createSocket(inaddr, i);
  }

  @Override
  public Socket createSocket(String s, int i, InetAddress inaddr, int j) throws IOException {
    return socketFactory.createSocket(s, i, inaddr, j);
  }

  @Override
  public Socket createSocket(String s, int i) throws IOException {
    return socketFactory.createSocket(s, i);
  }

  @Override
  public Socket createSocket() throws IOException {
    return socketFactory.createSocket();
  }

  @Override
  public String[] getDefaultCipherSuites() {
    return sslSocketFactory.getSupportedCipherSuites();
  }

  @Override
  public String[] getSupportedCipherSuites() {
    return sslSocketFactory.getSupportedCipherSuites();
  }
}
