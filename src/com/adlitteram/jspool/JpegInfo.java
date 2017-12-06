/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool;

import java.awt.Dimension;
import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JpegInfo {

    private static final Logger logger = LoggerFactory.getLogger(JpegInfo.class);

    public static Dimension getDimension(File file) {
        Dimension dim = new Dimension();

        if (file == null) {
            logger.info("JpegInfo: file is null");
            return dim;
        }

        if (!file.exists() || !file.canRead()) {
            logger.info("JpegInfo: file does not exist or cannot be read");
            return dim;
        }

        DataInputStream inbe = null;
        try {
            inbe = new DataInputStream(new BufferedInputStream(new FileInputStream(file)));

            if (inbe.readUnsignedByte() == 0xff && inbe.readUnsignedByte() == 0xd8) {
                while (true) {
                    int p1 = inbe.readUnsignedByte();
                    int p2 = inbe.readUnsignedByte();
                    if (p1 == 0xff && 0xc0 <= p2 && p2 <= 0xc3) {
                        inbe.skipBytes(3);
                        dim.height = inbe.readShort();
                        dim.width = inbe.readShort();
                        break;
                    } else {
                        // bypass this marker
                        int length = inbe.readShort();
                        inbe.skipBytes(length - 2);
                    }
                }
            }
            inbe.close();
        } catch (IOException e) {
            IOUtils.closeQuietly(inbe);
            logger.warn(file.getPath(), e);
            dim.width = 0;
            dim.height = 0;
        }
        return dim;
    }
}
