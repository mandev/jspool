/**
 * SourceFile.java
 * Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 1.0
 * @author Emmanuel Deviller  */

package com.adlitteram.jspool.files ;

import java.io.File;
import java.io.IOException;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;

public abstract class SourceFile {

   public static final int SORT_NONE = 0;
   //
   int sortOrder = SORT_NONE ;
   int maxStability = 0 ;
   int stability = 0 ;
   
   public SourceFile(int maxStab) {
      maxStability = maxStab ;
   }
   
   public void setMaxStability(int maxStab) {
      maxStability = maxStab ;
   }
   
   public final boolean isStabilized() {
      return ( stability >= maxStability ) ;
   }

   public boolean keepSortOrder() {
       return sortOrder != SORT_NONE ;
   }
   
   abstract public void init(long fileLength) ;
   
   abstract public void process(long fileLength) ;
   
   abstract public File getFile() ;
   
   abstract public String getPath() ;
   
   abstract public String getName() ;
   
   abstract public long getLength() ;
   
   abstract public boolean exists() ;
   
   abstract public boolean canRead() ;
   
   abstract public boolean canWrite() ;

   abstract public boolean delete() ;
   
   abstract public boolean close() ;

   abstract public boolean isDirectory() ;
   
   abstract public long lastModified() ;
   
   abstract public SourceFile [] listFiles(Pattern regexp) ;
   
   // 	Copy the src file to dst file
   public void copyTo(File dst) throws IOException {
      FileUtils.copyFile(getFile(), dst);
   }
      
}