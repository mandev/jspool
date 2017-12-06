-injars C:\dev\netbeans\jSpool\dist\jSpool.jar
-injars C:\dev\netbeans\framework\dist\framework.jar
-injars C:\dev\netbeans\sanselan\dist\sanselan.jar

-outjars C:\dev\netbeans\jSpool\dist\jSpool_out.jar

-libraryjars "C:\dev\jre\windows\jdk1.7.0_71\jre\lib\rt.jar"
-libraryjars "C:\dev\netbeans\jSpool\lib\"

-printseeds C:\dev\netbeans\jSpool\proguard\seeds.txt
-printusage C:\dev\netbeans\jSpool\proguard\usage.txt
-printmapping C:\dev\netbeans\jSpool\proguard\mapping.txt

-overloadaggressively
-defaultpackage ''
-dontskipnonpubliclibraryclasses
-dontskipnonpubliclibraryclassmembers

-keep public class com.adlitteram.pdftool.** {
    * ;
}

-keep public class com.adlitteram.jspool.Main {
    public static void main(java.lang.String[]);
}

-keep public class com.adlitteram.jspool.targets.Shell {
    public static *** _*(org.mozilla.javascript.Context, org.mozilla.javascript.Scriptable, java.lang.Object[], org.mozilla.javascript.Function) ;
}

-keep public class com.adlitteram.jspool.files.SourceFile {
    public * ;
}

-keep public class com.adlitteram.jspool.sources.AbstractSource {
    public * ;
}

-keep public class com.adlitteram.jspool.sources.LocalScript {
    public * ;
}

-keep public class com.adlitteram.jspool.FilenameCleaner {
    public * ;
}

-keep public class com.adlitteram.jspool.ScriptUtils {
    public * ;
}

-keep public class com.adlitteram.jspool.JpegInfo {
    public * ;
}
